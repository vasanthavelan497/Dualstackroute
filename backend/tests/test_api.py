import pytest
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import init_db


@pytest.fixture(scope="module")
def client():
    init_db()
    with TestClient(app) as c:
        yield c


def test_health_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "DualStackRoute" in data["service"]


def test_topology_endpoints(client):
    # GET topology
    res = client.get("/api/v1/topology")
    assert res.status_code == 200
    topo = res.json()
    assert topo["total_devices"] == 6
    assert topo["total_links"] == 7

    # GET device details
    dev_res = client.get("/api/v1/topology/devices/PC1")
    assert dev_res.status_code == 200
    assert dev_res.json()["name"] == "Source Client (PC1)"

    # GET link details
    link_res = client.get("/api/v1/topology/links/L1")
    assert link_res.status_code == 200
    assert link_res.json()["source"] == "PC1"

    # Non-existent device returns 404
    missing_dev = client.get("/api/v1/topology/devices/NONEXISTENT")
    assert missing_dev.status_code == 404


def test_link_fail_and_restore(client):
    # Fail L2
    fail_res = client.post("/api/v1/topology/links/L2/fail")
    assert fail_res.status_code == 200
    assert fail_res.json()["status"] == "down"

    # Verify topology reflects down link
    topo_res = client.get("/api/v1/topology")
    assert topo_res.json()["active_links"] == 6

    # Restore L2
    restore_res = client.post("/api/v1/topology/links/L2/restore")
    assert restore_res.status_code == 200
    assert restore_res.json()["status"] == "up"


def test_routing_calculation_api(client):
    req_body = {
        "source": "PC1",
        "destination": "PC2",
        "address_family": "ipv4",
        "constraints": {
            "max_latency": 100.0,
            "max_packet_loss": 5.0,
            "max_hops": 6
        }
    }
    res = client.post("/api/v1/routing/calculate", json=req_body)
    assert res.status_code == 200
    data = res.json()
    assert data["destination_reachable"] is True
    assert data["selected_route"]["path"] == ["PC1", "R1", "R2", "R4", "PC2"]


def test_ip_validation_api(client):
    # Valid IPv4
    res = client.post("/api/v1/ip/validate", json={"address": "192.168.1.100/24", "expected_version": 4})
    assert res.status_code == 200
    assert res.json()["is_valid"] is True
    assert res.json()["netmask"] == "255.255.255.0"

    # Valid IPv6
    res6 = client.post("/api/v1/ip/validate", json={"address": "2001:db8:abc::1/64"})
    assert res6.status_code == 200
    assert res6.json()["is_valid"] is True
    assert res6.json()["version"] == 6

    # Invalid address
    res_bad = client.post("/api/v1/ip/validate", json={"address": "invalid-ip"})
    assert res_bad.status_code == 200
    assert res_bad.json()["is_valid"] is False


def test_experiment_persistence_and_comparison(client):
    # 1. Create Experiment 1
    exp1_payload = {
        "name": "Baseline IPv4 Test",
        "category": "routing_lab",
        "address_family": "ipv4",
        "source": "PC1",
        "destination": "PC2",
        "topology_snapshot": {"devices": 6, "links": 7},
        "selected_route": {
            "path": ["PC1", "R1", "R2", "R4", "PC2"],
            "hop_count": 4,
            "total_latency": 40.0,
            "end_to_end_loss": 0.30,
            "bottleneck_bandwidth": 1000.0,
            "calculated_cost": 46.0,
            "is_feasible": True
        },
        "summary_explanation": "Baseline test selecting primary path"
    }
    create_res1 = client.post("/api/v1/experiments", json=exp1_payload)
    assert create_res1.status_code == 201
    exp1 = create_res1.json()
    exp1_id = exp1["id"]

    # 2. Create Experiment 2 (Failover)
    exp2_payload = {
        "name": "Link L2 Failure Test",
        "category": "failure_simulation",
        "address_family": "ipv4",
        "source": "PC1",
        "destination": "PC2",
        "topology_snapshot": {"devices": 6, "links": 7},
        "selected_route": {
            "path": ["PC1", "R1", "R3", "R4", "PC2"],
            "hop_count": 4,
            "total_latency": 60.0,
            "end_to_end_loss": 0.49,
            "bottleneck_bandwidth": 500.0,
            "calculated_cost": 59.8,
            "is_feasible": True
        },
        "summary_explanation": "Failover to alternate path via R3 after L2 failure"
    }
    create_res2 = client.post("/api/v1/experiments", json=exp2_payload)
    assert create_res2.status_code == 201
    exp2 = create_res2.json()
    exp2_id = exp2["id"]

    # 3. List experiments
    list_res = client.get("/api/v1/experiments")
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) >= 2

    # 4. Get specific experiment
    get_res = client.get(f"/api/v1/experiments/{exp1_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Baseline IPv4 Test"

    # 5. Compare experiments
    comp_res = client.post("/api/v1/experiments/compare", json={"experiment_ids": [exp1_id, exp2_id]})
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert len(comp_data["items"]) == 2
    assert len(comp_data["analysis_insights"]) > 0
    assert any("Latency shift" in ins for ins in comp_data["analysis_insights"])

    # 6. Export CSV
    csv_res = client.get("/api/v1/experiments/export/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Experiment ID,Timestamp (UTC),Name" in csv_res.text
    assert "Baseline IPv4 Test" in csv_res.text

    # 7. Delete experiment
    del_res = client.delete(f"/api/v1/experiments/{exp1_id}")
    assert del_res.status_code == 200
