export interface DeviceInterface {
  name: string;
  ipv4_address: string;
  ipv6_address: string;
  connected_link_id?: string;
}

export interface Device {
  id: string;
  name: string;
  type: 'host' | 'router';
  description: string;
  primary_ipv4: string;
  primary_ipv6: string;
  position_x: number;
  position_y: number;
  interfaces: DeviceInterface[];
}

export interface Link {
  id: string;
  name: string;
  source: string;
  target: string;
  latency: number;
  packet_loss: number;
  bandwidth: number;
  cost: number;
  status: 'up' | 'down';
  ipv4_subnet: string;
  ipv6_subnet: string;
  source_interface: string;
  target_interface: string;
}

export interface LinkUpdate {
  latency?: number;
  packet_loss?: number;
  bandwidth?: number;
  cost?: number;
  status?: 'up' | 'down';
}

export interface NetworkTopology {
  devices: Device[];
  links: Link[];
  scenario_version: string;
  total_devices: number;
  total_links: number;
  active_links: number;
  connected_components: number;
}

export interface QoSConstraints {
  max_latency?: number | null;
  max_packet_loss?: number | null;
  max_hops?: number | null;
  min_bandwidth?: number | null;
}

export interface RouteWeights {
  latency_weight: number;
  loss_weight: number;
  hop_weight: number;
}

export interface RouteRequest {
  source: string;
  destination: string;
  address_family: 'ipv4' | 'ipv6';
  constraints?: QoSConstraints;
  weights?: RouteWeights;
}

export interface PathHop {
  from_node: string;
  to_node: string;
  link_id: string;
  latency: number;
  packet_loss: number;
  bandwidth: number;
  ipv4_subnet: string;
  ipv6_subnet: string;
}

export interface CandidatePath {
  path: string[];
  link_ids: string[];
  hops: PathHop[];
  total_latency: number;
  end_to_end_loss: number;
  hop_count: number;
  bottleneck_bandwidth: number;
  bottleneck_link_id: string;
  calculated_cost: number;
  is_feasible: boolean;
  rejection_reasons: string[];
}

export interface RouteResponse {
  source: string;
  destination: string;
  address_family: 'ipv4' | 'ipv6';
  selected_route: CandidatePath | null;
  alternative_routes: CandidatePath[];
  rejected_routes: CandidatePath[];
  destination_reachable: boolean;
  feasible_path_count: number;
  total_paths_evaluated: number;
  selection_explanation: string;
  relaxation_suggestion?: string | null;
  applied_constraints?: QoSConstraints | null;
  applied_weights: RouteWeights;
}

export interface SimulationEvent {
  timestamp: string;
  event_type: string;
  target_id?: string;
  description: string;
  impact_summary?: string;
}

export interface ExperimentCreate {
  name: string;
  category?: string;
  address_family?: string;
  source: string;
  destination: string;
  topology_snapshot: any;
  qos_constraints?: any;
  selected_route?: any;
  candidate_routes?: any;
  before_metrics?: any;
  after_metrics?: any;
  event_timeline?: SimulationEvent[];
  summary_explanation: string;
}

export interface ExperimentListItem {
  id: string;
  created_at: string;
  name: string;
  category: string;
  address_family: string;
  source: string;
  destination: string;
  path_nodes?: string | null;
  hop_count?: number | null;
  total_latency?: number | null;
  end_to_end_loss?: number | null;
  bottleneck_bandwidth?: number | null;
  calculated_cost?: number | null;
  destination_reachable: boolean;
  is_qos_compliant: boolean;
  summary_explanation: string;
}

export interface ExperimentDetail extends ExperimentListItem {
  topology_snapshot: any;
  qos_constraints?: any;
  selected_route_json?: any;
  candidate_routes_json?: any;
  before_metrics?: any;
  after_metrics?: any;
  event_timeline?: SimulationEvent[];
}

export interface MetricComparison {
  experiment_id: string;
  name: string;
  category: string;
  address_family: string;
  path_nodes?: string | null;
  total_latency?: number | null;
  end_to_end_loss?: number | null;
  hop_count?: number | null;
  bottleneck_bandwidth?: number | null;
  calculated_cost?: number | null;
  destination_reachable: boolean;
  is_qos_compliant: boolean;
}

export interface ExperimentCompareResponse {
  items: MetricComparison[];
  analysis_insights: string[];
}

export interface IPValidationResponse {
  input_value: string;
  is_valid: boolean;
  version?: number | null;
  is_network_prefix: boolean;
  ip_address?: string | null;
  prefix_length?: number | null;
  netmask?: string | null;
  network_address?: string | null;
  broadcast_address?: string | null;
  total_hosts?: number | null;
  is_private: boolean;
  is_global: boolean;
  is_loopback: boolean;
  is_link_local: boolean;
  is_reserved: boolean;
  details: string;
  error_message?: string | null;
}
