import networkx as nx
from typing import Dict, List, Optional, Tuple
from backend.app.core.config import settings
from backend.app.schemas.network import Link, NetworkTopology
from backend.app.schemas.routing import (
    CandidatePath,
    PathHop,
    QoSConstraints,
    RouteRequest,
    RouteResponse,
    RouteWeights,
)


class RoutingEngine:
    @staticmethod
    def _build_graph(topology: NetworkTopology) -> Tuple[nx.Graph, Dict[Tuple[str, str], Link], Dict[str, Link]]:
        G = nx.Graph()
        for device in topology.devices:
            G.add_node(device.id, data=device)

        edge_to_link: Dict[Tuple[str, str], Link] = {}
        id_to_link: Dict[str, Link] = {}

        for link in topology.links:
            id_to_link[link.id] = link
            edge_to_link[(link.source, link.target)] = link
            edge_to_link[(link.target, link.source)] = link

            # Only add edge if link is operational ("up")
            if link.status == "up":
                G.add_edge(link.source, link.target, link_id=link.id, link=link)

        return G, edge_to_link, id_to_link

    @classmethod
    def calculate_route(
        cls,
        topology: NetworkTopology,
        request: RouteRequest
    ) -> RouteResponse:
        source = request.source
        destination = request.destination
        family = request.address_family
        constraints = request.constraints or QoSConstraints()
        weights = request.weights or RouteWeights(
            latency_weight=settings.DEFAULT_LATENCY_WEIGHT,
            loss_weight=settings.DEFAULT_LOSS_WEIGHT,
            hop_weight=settings.DEFAULT_HOP_WEIGHT,
        )

        device_ids = {d.id for d in topology.devices}
        if source not in device_ids or destination not in device_ids:
            return RouteResponse(
                source=source,
                destination=destination,
                address_family=family,
                selected_route=None,
                destination_reachable=False,
                selection_explanation=f"Invalid node specified. Source or destination is not in the active topology.",
                applied_constraints=constraints,
                applied_weights=weights
            )

        if source == destination:
            trivial_path = CandidatePath(
                path=[source],
                link_ids=[],
                hops=[],
                total_latency=0.0,
                end_to_end_loss=0.0,
                hop_count=0,
                bottleneck_bandwidth=10000.0,
                bottleneck_link_id="N/A",
                calculated_cost=0.0,
                is_feasible=True,
                rejection_reasons=[]
            )
            return RouteResponse(
                source=source,
                destination=destination,
                address_family=family,
                selected_route=trivial_path,
                destination_reachable=True,
                feasible_path_count=1,
                total_paths_evaluated=1,
                selection_explanation="Source and destination are identical host loopback.",
                applied_constraints=constraints,
                applied_weights=weights
            )

        # Build full network graph (including all physical connections to evaluate both active and failed paths)
        full_G = nx.Graph()
        for d in topology.devices:
            full_G.add_node(d.id)
        
        edge_map: Dict[Tuple[str, str], Link] = {}
        for l in topology.links:
            edge_map[(l.source, l.target)] = l
            edge_map[(l.target, l.source)] = l
            full_G.add_edge(l.source, l.target)

        # Enumerate all simple paths bounded to topology size (max depth 10)
        try:
            all_raw_paths = list(nx.all_simple_paths(full_G, source=source, target=destination, cutoff=10))
        except (nx.NodeNotFound, nx.NetworkXNoPath):
            all_raw_paths = []

        if not all_raw_paths:
            return RouteResponse(
                source=source,
                destination=destination,
                address_family=family,
                selected_route=None,
                destination_reachable=False,
                feasible_path_count=0,
                total_paths_evaluated=0,
                selection_explanation=f"No physical path exists between {source} and {destination}.",
                applied_constraints=constraints,
                applied_weights=weights
            )

        evaluated_candidates: List[CandidatePath] = []
        feasible_candidates: List[CandidatePath] = []
        rejected_candidates: List[CandidatePath] = []

        for raw_path in all_raw_paths:
            path_links: List[Link] = []
            has_failed_link = False
            failed_link_ids: List[str] = []

            for i in range(len(raw_path) - 1):
                u = raw_path[i]
                v = raw_path[i + 1]
                link = edge_map.get((u, v))
                if link:
                    path_links.append(link)
                    if link.status == "down":
                        has_failed_link = True
                        failed_link_ids.append(link.id)

            if not path_links:
                continue

            # Calculate metrics
            total_latency = sum(l.latency for l in path_links)
            
            # Independent link loss model: End-to-end loss = 1 - prod(1 - loss_fraction)
            survival_prob = 1.0
            for l in path_links:
                loss_fraction = max(0.0, min(1.0, l.packet_loss / 100.0))
                survival_prob *= (1.0 - loss_fraction)
            end_to_end_loss_pct = round((1.0 - survival_prob) * 100.0, 4)

            hop_count = len(path_links)

            # Bottleneck link (minimum bandwidth)
            bottleneck_link = min(path_links, key=lambda l: l.bandwidth)
            bottleneck_bandwidth = bottleneck_link.bandwidth
            bottleneck_link_id = bottleneck_link.id

            # Illustrative Cost Formula:
            # Cost = latency_weight * Total_Latency + loss_weight * Packet_Loss_% + hop_weight * Hop_Count
            calculated_cost = round(
                (weights.latency_weight * total_latency)
                + (weights.loss_weight * end_to_end_loss_pct)
                + (weights.hop_weight * hop_count),
                3
            )

            hops = [
                PathHop(
                    from_node=raw_path[idx],
                    to_node=raw_path[idx + 1],
                    link_id=path_links[idx].id,
                    latency=path_links[idx].latency,
                    packet_loss=path_links[idx].packet_loss,
                    bandwidth=path_links[idx].bandwidth,
                    ipv4_subnet=path_links[idx].ipv4_subnet,
                    ipv6_subnet=path_links[idx].ipv6_subnet
                )
                for idx in range(len(path_links))
            ]

            rejection_reasons: List[str] = []
            if has_failed_link:
                rejection_reasons.append(f"Contains down/failed link(s): {', '.join(failed_link_ids)}")

            # Hard QoS Constraint checks
            if constraints.max_latency is not None and total_latency > constraints.max_latency:
                rejection_reasons.append(
                    f"Latency ({total_latency:.1f}ms) exceeds max limit ({constraints.max_latency:.1f}ms)"
                )
            if constraints.max_packet_loss is not None and end_to_end_loss_pct > constraints.max_packet_loss:
                rejection_reasons.append(
                    f"Packet loss ({end_to_end_loss_pct:.2f}%) exceeds max limit ({constraints.max_packet_loss:.2f}%)"
                )
            if constraints.max_hops is not None and hop_count > constraints.max_hops:
                rejection_reasons.append(
                    f"Hop count ({hop_count}) exceeds max hops limit ({constraints.max_hops})"
                )
            if constraints.min_bandwidth is not None and bottleneck_bandwidth < constraints.min_bandwidth:
                rejection_reasons.append(
                    f"Bottleneck bandwidth ({bottleneck_bandwidth} Mbps) below required min ({constraints.min_bandwidth} Mbps)"
                )

            is_feasible = (len(rejection_reasons) == 0)

            candidate = CandidatePath(
                path=raw_path,
                link_ids=[l.id for l in path_links],
                hops=hops,
                total_latency=round(total_latency, 2),
                end_to_end_loss=end_to_end_loss_pct,
                hop_count=hop_count,
                bottleneck_bandwidth=bottleneck_bandwidth,
                bottleneck_link_id=bottleneck_link_id,
                calculated_cost=calculated_cost,
                is_feasible=is_feasible,
                rejection_reasons=rejection_reasons
            )

            evaluated_candidates.append(candidate)
            if is_feasible:
                feasible_candidates.append(candidate)
            else:
                rejected_candidates.append(candidate)

        # Deterministic sorting: lowest cost first, break ties by latency, then hop_count
        feasible_candidates.sort(key=lambda c: (c.calculated_cost, c.total_latency, c.hop_count))

        if feasible_candidates:
            selected_route = feasible_candidates[0]
            alternatives = feasible_candidates[1:]
            path_str = " -> ".join(selected_route.path)
            explanation = (
                f"Selected optimal route '{path_str}' via IPv{4 if family == 'ipv4' else 6} routing table. "
                f"Optimal composite QoS cost ({selected_route.calculated_cost:.2f}) satisfies all hard constraints "
                f"with {selected_route.total_latency:.1f}ms latency, {selected_route.end_to_end_loss:.2f}% estimated loss, "
                f"and {selected_route.hop_count} hops (bottleneck: {selected_route.bottleneck_bandwidth:.0f} Mbps on {selected_route.bottleneck_link_id})."
            )
            return RouteResponse(
                source=source,
                destination=destination,
                address_family=family,
                selected_route=selected_route,
                alternative_routes=alternatives,
                rejected_routes=rejected_candidates,
                destination_reachable=True,
                feasible_path_count=len(feasible_candidates),
                total_paths_evaluated=len(evaluated_candidates),
                selection_explanation=explanation,
                relaxation_suggestion=None,
                applied_constraints=constraints,
                applied_weights=weights
            )

        # No feasible route found
        # Check if physically all paths have failed links vs QoS rejected
        non_failed_paths = [c for c in evaluated_candidates if not any("failed link" in r for r in c.rejection_reasons)]
        if not non_failed_paths:
            return RouteResponse(
                source=source,
                destination=destination,
                address_family=family,
                selected_route=None,
                alternative_routes=[],
                rejected_routes=rejected_candidates,
                destination_reachable=False,
                feasible_path_count=0,
                total_paths_evaluated=len(evaluated_candidates),
                selection_explanation=f"Destination {destination} is completely unreachable from {source} due to link outages along all available transit routes.",
                relaxation_suggestion="Restore failed links in the Failure & Recovery Simulator to re-establish connectivity.",
                applied_constraints=constraints,
                applied_weights=weights
            )

        # Paths exist physically, but all violate QoS constraints
        # Formulate helpful suggestion
        min_available_lat = min(c.total_latency for c in non_failed_paths)
        min_available_loss = min(c.end_to_end_loss for c in non_failed_paths)
        min_available_hops = min(c.hop_count for c in non_failed_paths)
        max_available_bw = max(c.bottleneck_bandwidth for c in non_failed_paths)

        suggestions = []
        if constraints.max_latency is not None and constraints.max_latency < min_available_lat:
            suggestions.append(f"increase max latency to at least {min_available_lat:.1f}ms")
        if constraints.max_packet_loss is not None and constraints.max_packet_loss < min_available_loss:
            suggestions.append(f"increase packet loss tolerance to at least {min_available_loss:.2f}%")
        if constraints.max_hops is not None and constraints.max_hops < min_available_hops:
            suggestions.append(f"permit at least {min_available_hops} hops")
        if constraints.min_bandwidth is not None and constraints.min_bandwidth > max_available_bw:
            suggestions.append(f"reduce minimum bandwidth requirement below {max_available_bw:.0f} Mbps")

        suggestion_text = f"Consider relaxing constraints: {', '.join(suggestions)}." if suggestions else "Relax one or more QoS constraints."

        return RouteResponse(
            source=source,
            destination=destination,
            address_family=family,
            selected_route=None,
            alternative_routes=[],
            rejected_routes=rejected_candidates,
            destination_reachable=True,
            feasible_path_count=0,
            total_paths_evaluated=len(evaluated_candidates),
            selection_explanation=(
                f"Physical connectivity to {destination} exists across {len(non_failed_paths)} path(s), "
                f"but none satisfy the configured QoS constraints."
            ),
            relaxation_suggestion=suggestion_text,
            applied_constraints=constraints,
            applied_weights=weights
        )
