import csv
import io
import json
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.experiment import ExperimentModel
from backend.app.schemas.experiment import (
    ExperimentCreate,
    ExperimentDetail,
    ExperimentListItem,
    MetricComparison,
    ExperimentCompareResponse,
)


class ExperimentService:
    @staticmethod
    def create_experiment(db: Session, exp_in: ExperimentCreate) -> ExperimentDetail:
        # Extract metrics if selected_route exists
        sel = exp_in.selected_route
        path_nodes = None
        hop_count = None
        total_latency = None
        end_to_end_loss = None
        bottleneck_bw = None
        cost = None
        reachable = True
        qos_compliant = True

        if sel:
            path_list = sel.get("path", [])
            path_nodes = " -> ".join(path_list) if path_list else None
            hop_count = sel.get("hop_count")
            total_latency = sel.get("total_latency")
            end_to_end_loss = sel.get("end_to_end_loss")
            bottleneck_bw = sel.get("bottleneck_bandwidth")
            cost = sel.get("calculated_cost")
            qos_compliant = sel.get("is_feasible", True)
        else:
            # Check if destination was unreachable or unfeasible
            if exp_in.after_metrics:
                reachable = exp_in.after_metrics.get("destination_reachable", False)
                qos_compliant = exp_in.after_metrics.get("qos_satisfied", False)
            else:
                reachable = False
                qos_compliant = False

        db_obj = ExperimentModel(
            name=exp_in.name,
            category=exp_in.category,
            address_family=exp_in.address_family,
            source=exp_in.source,
            destination=exp_in.destination,
            path_nodes=path_nodes,
            hop_count=hop_count,
            total_latency=total_latency,
            end_to_end_loss=end_to_end_loss,
            bottleneck_bandwidth=bottleneck_bw,
            calculated_cost=cost,
            destination_reachable=reachable,
            is_qos_compliant=qos_compliant,
            topology_snapshot=json.dumps(exp_in.topology_snapshot),
            qos_constraints=json.dumps(exp_in.qos_constraints) if exp_in.qos_constraints else None,
            selected_route_json=json.dumps(exp_in.selected_route) if exp_in.selected_route else None,
            candidate_routes_json=json.dumps(exp_in.candidate_routes) if exp_in.candidate_routes else None,
            before_metrics=json.dumps(exp_in.before_metrics) if exp_in.before_metrics else None,
            after_metrics=json.dumps(exp_in.after_metrics) if exp_in.after_metrics else None,
            event_timeline=json.dumps([e.dict() for e in exp_in.event_timeline]) if exp_in.event_timeline else None,
            summary_explanation=exp_in.summary_explanation,
        )

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return ExperimentService._to_detail(db_obj)

    @staticmethod
    def list_experiments(
        db: Session,
        category: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[ExperimentListItem]:
        query = db.query(ExperimentModel)
        if category and category != "all":
            query = query.filter(ExperimentModel.category == category)
        if search:
            like_pat = f"%{search}%"
            query = query.filter(
                (ExperimentModel.name.ilike(like_pat)) |
                (ExperimentModel.source.ilike(like_pat)) |
                (ExperimentModel.destination.ilike(like_pat)) |
                (ExperimentModel.summary_explanation.ilike(like_pat))
            )
        records = query.order_by(ExperimentModel.created_at.desc()).limit(limit).all()
        return [ExperimentListItem.model_validate(r) for r in records]

    @staticmethod
    def get_experiment(db: Session, experiment_id: str) -> Optional[ExperimentDetail]:
        record = db.query(ExperimentModel).filter(ExperimentModel.id == experiment_id).first()
        if not record:
            return None
        return ExperimentService._to_detail(record)

    @staticmethod
    def delete_experiment(db: Session, experiment_id: str) -> bool:
        record = db.query(ExperimentModel).filter(ExperimentModel.id == experiment_id).first()
        if not record:
            return False
        db.delete(record)
        db.commit()
        return True

    @staticmethod
    def clear_all(db: Session) -> int:
        count = db.query(ExperimentModel).delete()
        db.commit()
        return count

    @staticmethod
    def compare_experiments(db: Session, experiment_ids: List[str]) -> ExperimentCompareResponse:
        records = db.query(ExperimentModel).filter(ExperimentModel.id.in_(experiment_ids)).all()
        # Preserve order of requested experiment_ids
        rec_map = {r.id: r for r in records}
        ordered = [rec_map[eid] for eid in experiment_ids if eid in rec_map]

        items = [
            MetricComparison(
                experiment_id=r.id,
                name=r.name,
                category=r.category,
                address_family=r.address_family,
                path_nodes=r.path_nodes,
                total_latency=r.total_latency,
                end_to_end_loss=r.end_to_end_loss,
                hop_count=r.hop_count,
                bottleneck_bandwidth=r.bottleneck_bandwidth,
                calculated_cost=r.calculated_cost,
                destination_reachable=r.destination_reachable,
                is_qos_compliant=r.is_qos_compliant
            )
            for r in ordered
        ]

        insights: List[str] = []
        if len(items) >= 2:
            base = items[0]
            for comp in items[1:]:
                # Latency diff
                if base.total_latency is not None and comp.total_latency is not None:
                    diff = comp.total_latency - base.total_latency
                    if abs(diff) > 0.01:
                        sign = "+" if diff > 0 else ""
                        insights.append(
                            f"Latency shift between '{base.name}' and '{comp.name}': {sign}{diff:.1f}ms "
                            f"({base.total_latency:.1f}ms -> {comp.total_latency:.1f}ms)."
                        )
                # Cost diff
                if base.calculated_cost is not None and comp.calculated_cost is not None:
                    cdiff = comp.calculated_cost - base.calculated_cost
                    if abs(cdiff) > 0.01:
                        csign = "+" if cdiff > 0 else ""
                        insights.append(
                            f"Composite cost shift: {csign}{cdiff:.2f} ({base.calculated_cost:.2f} -> {comp.calculated_cost:.2f})."
                        )
                # Reachability
                if base.destination_reachable != comp.destination_reachable:
                    status_from = "Reachable" if base.destination_reachable else "Unreachable"
                    status_to = "Reachable" if comp.destination_reachable else "Unreachable"
                    insights.append(f"Network reachability changed from {status_from} to {status_to}.")

        if not insights:
            insights.append("Compared experiments exhibit identical performance metrics and reachability.")

        return ExperimentCompareResponse(items=items, analysis_insights=insights)

    @staticmethod
    def export_csv(db: Session) -> str:
        records = db.query(ExperimentModel).order_by(ExperimentModel.created_at.desc()).all()
        output = io.StringIO()
        writer = csv.writer(output)

        headers = [
            "Experiment ID",
            "Timestamp (UTC)",
            "Name",
            "Category",
            "Address Family",
            "Source",
            "Destination",
            "Selected Path",
            "Hops",
            "Total Latency (ms)",
            "End-to-End Packet Loss (%)",
            "Bottleneck Bandwidth (Mbps)",
            "Calculated Cost",
            "Destination Reachable",
            "QoS Compliant",
            "Summary"
        ]
        writer.writerow(headers)

        for r in records:
            writer.writerow([
                r.id,
                r.created_at.isoformat() if r.created_at else "",
                r.name,
                r.category,
                r.address_family,
                r.source,
                r.destination,
                r.path_nodes or "None",
                r.hop_count if r.hop_count is not None else "",
                r.total_latency if r.total_latency is not None else "",
                r.end_to_end_loss if r.end_to_end_loss is not None else "",
                r.bottleneck_bandwidth if r.bottleneck_bandwidth is not None else "",
                r.calculated_cost if r.calculated_cost is not None else "",
                "Yes" if r.destination_reachable else "No",
                "Yes" if r.is_qos_compliant else "No",
                r.summary_explanation.replace("\n", " ")
            ])

        return output.getvalue()

    @staticmethod
    def _to_detail(model: ExperimentModel) -> ExperimentDetail:
        return ExperimentDetail(
            id=model.id,
            created_at=model.created_at,
            name=model.name,
            category=model.category,
            address_family=model.address_family,
            source=model.source,
            destination=model.destination,
            path_nodes=model.path_nodes,
            hop_count=model.hop_count,
            total_latency=model.total_latency,
            end_to_end_loss=model.end_to_end_loss,
            bottleneck_bandwidth=model.bottleneck_bandwidth,
            calculated_cost=model.calculated_cost,
            destination_reachable=model.destination_reachable,
            is_qos_compliant=model.is_qos_compliant,
            summary_explanation=model.summary_explanation,
            topology_snapshot=json.loads(model.topology_snapshot) if model.topology_snapshot else {},
            qos_constraints=json.loads(model.qos_constraints) if model.qos_constraints else None,
            selected_route_json=json.loads(model.selected_route_json) if model.selected_route_json else None,
            candidate_routes_json=json.loads(model.candidate_routes_json) if model.candidate_routes_json else None,
            before_metrics=json.loads(model.before_metrics) if model.before_metrics else None,
            after_metrics=json.loads(model.after_metrics) if model.after_metrics else None,
            event_timeline=json.loads(model.event_timeline) if model.event_timeline else None,
        )
