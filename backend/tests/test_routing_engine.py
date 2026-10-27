import pytest
from backend.app.schemas.network import LinkUpdate
from backend.app.schemas.routing import QoSConstraints, RouteRequest, RouteWeights
from backend.app.services.routing_engine import RoutingEngine
from backend.app.services.topology_service import TopologyService


@pytest.fixture
def topology_service_instance():
    service = TopologyService()
    service.reset_scenario()
    return service


def test_normal_route_calculation_lowest_cost(topology_service_instance):
    """
    Default topology has two primary paths:
    Path 1 (Primary): PC1 -> R1 -> R2 -> R4 -> PC2
      Latency: 5 + 15 + 15 + 5 = 40.0 ms
      Loss: 1 - (1-0.0005)*(1-0.001)*(1-0.001)*(1-0.0005) = ~0.299%
      Hops: 4
      Cost: 0.5 * 40 + 20 * 0.30 + 5 * 4 = 20 + 6 + 20 = ~46
    Path 2 (Alternate): PC1 -> R1 -> R3 -> R4 -> PC2
      Latency: 5 + 25 + 25 + 5 = 60.0 ms
      Hops: 4
      Cost: 0.5 * 60 + ... = 30 + ... = ~59
    Should select Path 1.
    """
    topo = topology_service_instance.get_topology()
    req = RouteRequest(source="PC1", destination="PC2", address_family="ipv4")
    res = RoutingEngine.calculate_route(topo, req)

    assert res.destination_reachable is True
    assert res.selected_route is not None
    assert res.selected_route.path == ["PC1", "R1", "R2", "R4", "PC2"]
    assert res.selected_route.hop_count == 4
    assert res.selected_route.total_latency == 40.0
    assert len(res.alternative_routes) >= 1
    # Cost of selected path must be less than alternative path
    assert res.selected_route.calculated_cost < res.alternative_routes[0].calculated_cost


def test_max_latency_constraint(topology_service_instance):
    """
    If max_latency is 45ms, Path 1 (40ms) is feasible, Path 2 (60ms) is rejected.
    If max_latency is 35ms, both paths are rejected.
    """
    topo = topology_service_instance.get_topology()
    
    # 45ms constraint -> Path 1 feasible
    req1 = RouteRequest(
        source="PC1",
        destination="PC2",
        constraints=QoSConstraints(max_latency=45.0)
    )
    res1 = RoutingEngine.calculate_route(topo, req1)
    assert res1.selected_route is not None
    assert res1.selected_route.path == ["PC1", "R1", "R2", "R4", "PC2"]

    # 35ms constraint -> neither feasible, suggestions provided
    req2 = RouteRequest(
        source="PC1",
        destination="PC2",
        constraints=QoSConstraints(max_latency=35.0)
    )
    res2 = RoutingEngine.calculate_route(topo, req2)
    assert res2.selected_route is None
    assert res2.destination_reachable is True
    assert res2.feasible_path_count == 0
    assert "increase max latency to at least 40.0ms" in res2.relaxation_suggestion


def test_max_packet_loss_constraint(topology_service_instance):
    """
    If max_packet_loss is set below the path's end-to-end loss, it must reject.
    """
    topo = topology_service_instance.get_topology()
    req = RouteRequest(
        source="PC1",
        destination="PC2",
        constraints=QoSConstraints(max_packet_loss=0.01)
    )
    res = RoutingEngine.calculate_route(topo, req)
    assert res.selected_route is None
    assert res.relaxation_suggestion is not None
    assert "packet loss" in res.relaxation_suggestion.lower()


def test_max_hop_constraint(topology_service_instance):
    """
    PC1 to PC2 requires at least 4 hops. Setting max_hops=3 should reject all paths.
    """
    topo = topology_service_instance.get_topology()
    req = RouteRequest(
        source="PC1",
        destination="PC2",
        constraints=QoSConstraints(max_hops=3)
    )
    res = RoutingEngine.calculate_route(topo, req)
    assert res.selected_route is None
    assert "permit at least 4 hops" in res.relaxation_suggestion


def test_failed_link_alternate_routing(topology_service_instance):
    """
    When primary link L2 (R1-R2) fails, route must automatically fail over to
    alternate path via R3 (PC1 -> R1 -> R3 -> R4 -> PC2).
    """
    # Fail L2
    topology_service_instance.fail_link("L2")
    topo = topology_service_instance.get_topology()

    req = RouteRequest(source="PC1", destination="PC2", address_family="ipv4")
    res = RoutingEngine.calculate_route(topo, req)

    assert res.destination_reachable is True
    assert res.selected_route is not None
    assert res.selected_route.path == ["PC1", "R1", "R3", "R4", "PC2"]
    assert res.selected_route.total_latency == 60.0
    # Any route containing L2 must be in rejected_routes with "down/failed" reason
    l2_routes = [r for r in res.rejected_routes if "L2" in r.link_ids]
    assert len(l2_routes) > 0
    assert any("failed link" in r.rejection_reasons[0] for r in l2_routes)


def test_restoration_of_failed_link(topology_service_instance):
    """
    After failing and then restoring L2, primary route should be preferred again.
    """
    topology_service_instance.fail_link("L2")
    topology_service_instance.restore_link("L2")
    topo = topology_service_instance.get_topology()

    req = RouteRequest(source="PC1", destination="PC2", address_family="ipv4")
    res = RoutingEngine.calculate_route(topo, req)

    assert res.selected_route is not None
    assert res.selected_route.path == ["PC1", "R1", "R2", "R4", "PC2"]


def test_unreachable_destination(topology_service_instance):
    """
    Failing access link L1 or L7 isolates the host and makes destination completely unreachable.
    """
    topology_service_instance.fail_link("L1")
    topo = topology_service_instance.get_topology()

    req = RouteRequest(source="PC1", destination="PC2")
    res = RoutingEngine.calculate_route(topo, req)

    assert res.destination_reachable is False
    assert res.selected_route is None
    assert "completely unreachable" in res.selection_explanation


def test_invalid_source_or_destination(topology_service_instance):
    topo = topology_service_instance.get_topology()
    req = RouteRequest(source="UNKNOWN_NODE", destination="PC2")
    res = RoutingEngine.calculate_route(topo, req)
    assert res.destination_reachable is False
    assert "Invalid node" in res.selection_explanation


def test_deterministic_results(topology_service_instance):
    """
    Identical queries must produce exact same numerical results.
    """
    topo = topology_service_instance.get_topology()
    req = RouteRequest(source="PC1", destination="PC2")
    res1 = RoutingEngine.calculate_route(topo, req)
    res2 = RoutingEngine.calculate_route(topo, req)

    assert res1.selected_route.calculated_cost == res2.selected_route.calculated_cost
    assert res1.selected_route.total_latency == res2.selected_route.total_latency
    assert res1.selected_route.end_to_end_loss == res2.selected_route.end_to_end_loss
    assert res1.selected_route.path == res2.selected_route.path
