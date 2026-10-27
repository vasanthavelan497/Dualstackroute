import copy
import threading
from typing import Dict, List, Optional
from backend.app.schemas.network import Device, DeviceInterface, Link, LinkUpdate, NetworkTopology


class TopologyService:
    def __init__(self):
        self._lock = threading.RLock()
        self._default_devices: Dict[str, Device] = {}
        self._default_links: Dict[str, Link] = {}
        self._current_devices: Dict[str, Device] = {}
        self._current_links: Dict[str, Link] = {}
        self._init_default_scenario()

    def _init_default_scenario(self):
        # 6 Nodes: PC1, R1, R2, R3, R4, PC2
        devices = [
            Device(
                id="PC1",
                name="Source Client (PC1)",
                type="host",
                description="Client workstation initiating dual-stack traffic flows",
                primary_ipv4="192.168.10.2",
                primary_ipv6="2001:db8:10::2",
                position_x=100.0,
                position_y=260.0,
                interfaces=[
                    DeviceInterface(
                        name="eth0",
                        ipv4_address="192.168.10.2/24",
                        ipv6_address="2001:db8:10::2/64",
                        connected_link_id="L1"
                    )
                ]
            ),
            Device(
                id="R1",
                name="Edge Router R1",
                type="router",
                description="Source-side gateway router performing ingress dual-stack forwarding",
                primary_ipv4="10.0.1.1",
                primary_ipv6="2001:db8:1::1",
                position_x=320.0,
                position_y=260.0,
                interfaces=[
                    DeviceInterface(
                        name="eth0",
                        ipv4_address="192.168.10.1/24",
                        ipv6_address="2001:db8:10::1/64",
                        connected_link_id="L1"
                    ),
                    DeviceInterface(
                        name="eth1",
                        ipv4_address="10.0.12.1/30",
                        ipv6_address="2001:db8:12::1/64",
                        connected_link_id="L2"
                    ),
                    DeviceInterface(
                        name="eth2",
                        ipv4_address="10.0.13.1/30",
                        ipv6_address="2001:db8:13::1/64",
                        connected_link_id="L4"
                    )
                ]
            ),
            Device(
                id="R2",
                name="Core Router R2 (Primary Path)",
                type="router",
                description="High-speed low-latency transit router on the primary path",
                primary_ipv4="10.0.2.1",
                primary_ipv6="2001:db8:2::1",
                position_x=560.0,
                position_y=130.0,
                interfaces=[
                    DeviceInterface(
                        name="eth0",
                        ipv4_address="10.0.12.2/30",
                        ipv6_address="2001:db8:12::2/64",
                        connected_link_id="L2"
                    ),
                    DeviceInterface(
                        name="eth1",
                        ipv4_address="10.0.24.1/30",
                        ipv6_address="2001:db8:24::1/64",
                        connected_link_id="L3"
                    ),
                    DeviceInterface(
                        name="eth2",
                        ipv4_address="10.0.23.1/30",
                        ipv6_address="2001:db8:23::1/64",
                        connected_link_id="L6"
                    )
                ]
            ),
            Device(
                id="R3",
                name="Core Router R3 (Alternate Path)",
                type="router",
                description="Secondary transit router providing alternate path resilience",
                primary_ipv4="10.0.3.1",
                primary_ipv6="2001:db8:3::1",
                position_x=560.0,
                position_y=390.0,
                interfaces=[
                    DeviceInterface(
                        name="eth0",
                        ipv4_address="10.0.13.2/30",
                        ipv6_address="2001:db8:13::2/64",
                        connected_link_id="L4"
                    ),
                    DeviceInterface(
                        name="eth1",
                        ipv4_address="10.0.34.1/30",
                        ipv6_address="2001:db8:34::1/64",
                        connected_link_id="L5"
                    ),
                    DeviceInterface(
                        name="eth2",
                        ipv4_address="10.0.23.2/30",
                        ipv6_address="2001:db8:23::2/64",
                        connected_link_id="L6"
                    )
                ]
            ),
            Device(
                id="R4",
                name="Edge Router R4",
                type="router",
                description="Destination-side egress dual-stack gateway router",
                primary_ipv4="10.0.4.1",
                primary_ipv6="2001:db8:4::1",
                position_x=800.0,
                position_y=260.0,
                interfaces=[
                    DeviceInterface(
                        name="eth0",
                        ipv4_address="10.0.24.2/30",
                        ipv6_address="2001:db8:24::2/64",
                        connected_link_id="L3"
                    ),
                    DeviceInterface(
                        name="eth1",
                        ipv4_address="10.0.34.2/30",
                        ipv6_address="2001:db8:34::2/64",
                        connected_link_id="L5"
                    ),
                    DeviceInterface(
                        name="eth2",
                        ipv4_address="192.168.20.1/24",
                        ipv6_address="2001:db8:20::1/64",
                        connected_link_id="L7"
                    )
                ]
            ),
            Device(
                id="PC2",
                name="Destination Server (PC2)",
                type="host",
                description="Target server receiving dual-stack application traffic",
                primary_ipv4="192.168.20.2",
                primary_ipv6="2001:db8:20::2",
                position_x=1020.0,
                position_y=260.0,
                interfaces=[
                    DeviceInterface(
                        name="eth0",
                        ipv4_address="192.168.20.2/24",
                        ipv6_address="2001:db8:20::2/64",
                        connected_link_id="L7"
                    )
                ]
            )
        ]

        links = [
            Link(
                id="L1",
                name="PC1-R1 Access Link",
                source="PC1",
                target="R1",
                latency=5.0,
                packet_loss=0.05,
                bandwidth=1000.0,
                cost=1.0,
                status="up",
                ipv4_subnet="192.168.10.0/24",
                ipv6_subnet="2001:db8:10::/64",
                source_interface="eth0",
                target_interface="eth0"
            ),
            Link(
                id="L2",
                name="R1-R2 Primary Core Link",
                source="R1",
                target="R2",
                latency=15.0,
                packet_loss=0.10,
                bandwidth=1000.0,
                cost=2.0,
                status="up",
                ipv4_subnet="10.0.12.0/30",
                ipv6_subnet="2001:db8:12::/64",
                source_interface="eth1",
                target_interface="eth0"
            ),
            Link(
                id="L3",
                name="R2-R4 Primary Core Link",
                source="R2",
                target="R4",
                latency=15.0,
                packet_loss=0.10,
                bandwidth=1000.0,
                cost=2.0,
                status="up",
                ipv4_subnet="10.0.24.0/30",
                ipv6_subnet="2001:db8:24::/64",
                source_interface="eth1",
                target_interface="eth0"
            ),
            Link(
                id="L4",
                name="R1-R3 Alternate Core Link",
                source="R1",
                target="R3",
                latency=25.0,
                packet_loss=0.20,
                bandwidth=500.0,
                cost=3.0,
                status="up",
                ipv4_subnet="10.0.13.0/30",
                ipv6_subnet="2001:db8:13::/64",
                source_interface="eth2",
                target_interface="eth0"
            ),
            Link(
                id="L5",
                name="R3-R4 Alternate Core Link",
                source="R3",
                target="R4",
                latency=25.0,
                packet_loss=0.20,
                bandwidth=500.0,
                cost=3.0,
                status="up",
                ipv4_subnet="10.0.34.0/30",
                ipv6_subnet="2001:db8:34::/64",
                source_interface="eth1",
                target_interface="eth1"
            ),
            Link(
                id="L6",
                name="R2-R3 Inter-Router Link",
                source="R2",
                target="R3",
                latency=10.0,
                packet_loss=0.10,
                bandwidth=500.0,
                cost=2.5,
                status="up",
                ipv4_subnet="10.0.23.0/30",
                ipv6_subnet="2001:db8:23::/64",
                source_interface="eth2",
                target_interface="eth2"
            ),
            Link(
                id="L7",
                name="R4-PC2 Access Link",
                source="R4",
                target="PC2",
                latency=5.0,
                packet_loss=0.05,
                bandwidth=1000.0,
                cost=1.0,
                status="up",
                ipv4_subnet="192.168.20.0/24",
                ipv6_subnet="2001:db8:20::/64",
                source_interface="eth2",
                target_interface="eth0"
            )
        ]

        self._default_devices = {d.id: d for d in devices}
        self._default_links = {l.id: l for l in links}
        self._current_devices = copy.deepcopy(self._default_devices)
        self._current_links = copy.deepcopy(self._default_links)

    def get_topology(self) -> NetworkTopology:
        with self._lock:
            devices_list = list(self._current_devices.values())
            links_list = list(self._current_links.values())
            active = sum(1 for l in links_list if l.status == "up")
            return NetworkTopology(
                devices=devices_list,
                links=links_list,
                scenario_version="1.0",
                total_devices=len(devices_list),
                total_links=len(links_list),
                active_links=active,
                connected_components=1
            )

    def get_device(self, device_id: str) -> Optional[Device]:
        with self._lock:
            return self._current_devices.get(device_id)

    def get_link(self, link_id: str) -> Optional[Link]:
        with self._lock:
            return self._current_links.get(link_id)

    def update_link(self, link_id: str, update: LinkUpdate) -> Optional[Link]:
        with self._lock:
            link = self._current_links.get(link_id)
            if not link:
                return None
            if update.latency is not None:
                link.latency = update.latency
            if update.packet_loss is not None:
                link.packet_loss = update.packet_loss
            if update.bandwidth is not None:
                link.bandwidth = update.bandwidth
            if update.cost is not None:
                link.cost = update.cost
            if update.status is not None:
                link.status = update.status
            return link

    def fail_link(self, link_id: str) -> Optional[Link]:
        with self._lock:
            link = self._current_links.get(link_id)
            if not link:
                return None
            link.status = "down"
            return link

    def restore_link(self, link_id: str) -> Optional[Link]:
        with self._lock:
            link = self._current_links.get(link_id)
            if not link:
                return None
            link.status = "up"
            return link

    def reset_scenario(self) -> NetworkTopology:
        with self._lock:
            self._current_devices = copy.deepcopy(self._default_devices)
            self._current_links = copy.deepcopy(self._default_links)
            return self.get_topology()


topology_service = TopologyService()
