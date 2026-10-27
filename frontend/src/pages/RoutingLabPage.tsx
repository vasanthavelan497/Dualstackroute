import React, { useState } from 'react';
import {
  NetworkTopology,
  RouteResponse,
  QoSConstraints,
  RouteWeights,
  RouteRequest,
  ExperimentCreate,
} from '../types/network';
import {
  Sliders,
  CheckCircle2,
  XCircle,
  Sparkles,
  Save,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface RoutingLabPageProps {
  topology: NetworkTopology;
  routeResult: RouteResponse | null;
  onCalculateRoute: (req: RouteRequest) => Promise<void>;
  onResetTopology: () => Promise<void>;
  onSaveExperiment: (exp: ExperimentCreate) => Promise<void>;
  loading: boolean;
}

export const RoutingLabPage: React.FC<RoutingLabPageProps> = ({
  topology,
  routeResult,
  onCalculateRoute,
  onResetTopology,
  onSaveExperiment,
  loading,
}) => {
  const [source, setSource] = useState<string>('PC1');
  const [destination, setDestination] = useState<string>('PC2');
  const [addressFamily, setAddressFamily] = useState<'ipv4' | 'ipv6'>('ipv4');

  // QoS constraints
  const [maxLatency, setMaxLatency] = useState<number | ''>('');
  const [maxPacketLoss, setMaxPacketLoss] = useState<number | ''>('');
  const [maxHops, setMaxHops] = useState<number | ''>('');
  const [minBandwidth, setMinBandwidth] = useState<number | ''>('');

  // Cost weights
  const [latencyWeight, setLatencyWeight] = useState<number>(0.5);
  const [lossWeight, setLossWeight] = useState<number>(20.0);
  const [hopWeight, setHopWeight] = useState<number>(5.0);

  // Experiment save dialog state
  const [savingExp, setSavingExp] = useState<boolean>(false);
  const [expName, setExpName] = useState<string>('QoS Routing Experiment');

  const handleRecalculate = async () => {
    const constraints: QoSConstraints = {};
    if (typeof maxLatency === 'number') constraints.max_latency = maxLatency;
    if (typeof maxPacketLoss === 'number') constraints.max_packet_loss = maxPacketLoss;
    if (typeof maxHops === 'number') constraints.max_hops = maxHops;
    if (typeof minBandwidth === 'number') constraints.min_bandwidth = minBandwidth;

    const weights: RouteWeights = {
      latency_weight: latencyWeight,
      loss_weight: lossWeight,
      hop_weight: hopWeight,
    };

    await onCalculateRoute({
      source,
      destination,
      address_family: addressFamily,
      constraints,
      weights,
    });
  };

  const handleSave = async () => {
    if (!routeResult) return;
    setSavingExp(true);
    try {
      await onSaveExperiment({
        name: expName,
        category: 'routing_lab',
        address_family: addressFamily,
        source,
        destination,
        topology_snapshot: topology,
        qos_constraints: {
          max_latency: maxLatency || null,
          max_packet_loss: maxPacketLoss || null,
          max_hops: maxHops || null,
          min_bandwidth: minBandwidth || null,
          weights: { latencyWeight, lossWeight, hopWeight },
        },
        selected_route: routeResult.selected_route,
        candidate_routes: [
          ...(routeResult.selected_route ? [routeResult.selected_route] : []),
          ...routeResult.alternative_routes,
          ...routeResult.rejected_routes,
        ],
        summary_explanation: routeResult.selection_explanation,
      });
      alert('Experiment successfully saved to SQLite history!');
    } catch (err: any) {
      alert(`Failed to save experiment: ${err.message}`);
    } finally {
      setSavingExp(false);
    }
  };

  const selectedRoute = routeResult?.selected_route;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={22} color="#3b82f6" />
            Routing Optimization Lab
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Configure hard Quality-of-Service constraints and evaluate deterministic dual-stack path costs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onResetTopology} disabled={loading}>
            <RotateCcw size={15} />
            <span>Reset Baseline</span>
          </button>
          <button className="btn btn-primary" onClick={handleRecalculate} disabled={loading}>
            <Zap size={15} />
            <span>Recalculate Route</span>
          </button>
        </div>
      </div>

      {/* Control Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Endpoint & Family Settings */}
        <div className="panel">
          <div className="panel-title">1. Flow Endpoints & Protocol</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Source Node</label>
              <select className="select-input" value={source} onChange={(e) => setSource(e.target.value)}>
                {topology.devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.id} ({d.name.split(' ')[0]})</option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Destination Node</label>
              <select className="select-input" value={destination} onChange={(e) => setDestination(e.target.value)}>
                {topology.devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.id} ({d.name.split(' ')[0]})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Address Family</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn ${addressFamily === 'ipv4' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.5rem' }}
                onClick={() => setAddressFamily('ipv4')}
              >
                IPv4 Stack
              </button>
              <button
                type="button"
                className={`btn ${addressFamily === 'ipv6' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.5rem' }}
                onClick={() => setAddressFamily('ipv6')}
              >
                IPv6 Stack
              </button>
            </div>
          </div>
        </div>

        {/* Hard QoS Constraints */}
        <div className="panel">
          <div className="panel-title">
            <span>2. Hard QoS Constraints</span>
            <span className="badge badge-neutral">Pruning Thresholds</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Max Latency (ms)</label>
              <input
                type="number"
                placeholder="e.g. 50"
                className="text-input"
                value={maxLatency}
                onChange={(e) => setMaxLatency(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Max Packet Loss (%)</label>
              <input
                type="number"
                step="0.05"
                placeholder="e.g. 0.5"
                className="text-input"
                value={maxPacketLoss}
                onChange={(e) => setMaxPacketLoss(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Max Hops</label>
              <input
                type="number"
                placeholder="e.g. 4"
                className="text-input"
                value={maxHops}
                onChange={(e) => setMaxHops(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Min Bandwidth (Mbps)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                className="text-input"
                value={minBandwidth}
                onChange={(e) => setMinBandwidth(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Cost Formula Weights */}
        <div className="panel">
          <div className="panel-title">
            <span>3. Objective Cost Formula</span>
            <span className="badge badge-neutral">Weights</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem', fontStyle: 'italic' }}>
            Cost = w_lat · Latency + w_loss · Loss% + w_hops · Hops
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div className="input-group">
              <label className="input-label">w_lat</label>
              <input
                type="number"
                step="0.1"
                className="text-input"
                value={latencyWeight}
                onChange={(e) => setLatencyWeight(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">w_loss</label>
              <input
                type="number"
                step="1"
                className="text-input"
                value={lossWeight}
                onChange={(e) => setLossWeight(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">w_hops</label>
              <input
                type="number"
                step="1"
                className="text-input"
                value={hopWeight}
                onChange={(e) => setHopWeight(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Route Result Display */}
      {routeResult && (
        <div style={{ marginBottom: '1.5rem' }}>
          {selectedRoute ? (
            <div className="panel" style={{ borderLeft: '4px solid #10b981', background: '#0e1d28' }}>
              <div className="panel-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
                  <CheckCircle2 size={18} />
                  Optimal Feasible Route Selected
                </span>
                <span className="badge badge-green">COST: {selectedRoute.calculated_cost.toFixed(2)}</span>
              </div>

              <div
                className="font-mono"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#a7f3d0',
                  background: '#09151f',
                  padding: '0.75rem 1rem',
                  borderRadius: 6,
                  marginBottom: '1rem',
                }}
              >
                {selectedRoute.path.join('  ───►  ')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: '#090e1c', padding: '0.75rem', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>TOTAL LATENCY</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
                    {selectedRoute.total_latency.toFixed(1)} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ms</span>
                  </div>
                </div>

                <div style={{ background: '#090e1c', padding: '0.75rem', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>END-TO-END LOSS</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fbbf24' }}>
                    {selectedRoute.end_to_end_loss.toFixed(2)} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>%</span>
                  </div>
                </div>

                <div style={{ background: '#090e1c', padding: '0.75rem', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>HOP COUNT</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f8fafc' }}>
                    {selectedRoute.hop_count} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>hops</span>
                  </div>
                </div>

                <div style={{ background: '#090e1c', padding: '0.75rem', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>BOTTLENECK BANDWIDTH</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8' }}>
                    {selectedRoute.bottleneck_bandwidth} <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Mbps</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>on {selectedRoute.bottleneck_link_id}</div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1rem' }}>
                {routeResult.selection_explanation}
              </p>

              {/* Save Experiment Row */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#090e1c', padding: '0.75rem', borderRadius: 8 }}>
                <input
                  type="text"
                  className="text-input"
                  style={{ flex: 1, padding: '0.45rem 0.75rem' }}
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  placeholder="Experiment title to persist in SQLite"
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={savingExp}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  <Save size={15} />
                  <span>{savingExp ? 'Saving...' : 'Persist Experiment'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="panel" style={{ borderLeft: '4px solid #ef4444', background: '#201015' }}>
              <div className="panel-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                  <XCircle size={18} />
                  No Feasible Path Satisfies QoS Constraints
                </span>
                <span className="badge badge-red">CONSTRAINTS VIOLATED</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                {routeResult.selection_explanation}
              </p>
              {routeResult.relaxation_suggestion && (
                <div className="alert-box alert-warning">
                  <Sparkles size={16} />
                  <div>
                    <strong>Engine Recommendation:</strong> {routeResult.relaxation_suggestion}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Candidate Evaluation Tables */}
      {routeResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.25rem' }}>
          {/* Feasible Alternatives */}
          <div className="panel">
            <div className="panel-title">
              <span>Feasible Alternative Paths</span>
              <span className="badge badge-neutral">{routeResult.alternative_routes.length} candidates</span>
            </div>
            {routeResult.alternative_routes.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No other feasible routes satisfied the QoS thresholds.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate Route</th>
                    <th>Cost</th>
                    <th>Latency</th>
                    <th>Loss</th>
                    <th>Hops</th>
                  </tr>
                </thead>
                <tbody>
                  {routeResult.alternative_routes.map((cand, idx) => (
                    <tr key={idx}>
                      <td className="font-mono" style={{ color: '#cbd5e1' }}>{cand.path.join(' → ')}</td>
                      <td><span className="badge badge-amber">{cand.calculated_cost.toFixed(2)}</span></td>
                      <td>{cand.total_latency.toFixed(1)}ms</td>
                      <td>{cand.end_to_end_loss.toFixed(2)}%</td>
                      <td>{cand.hop_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Rejected Candidates & Reasons */}
          <div className="panel">
            <div className="panel-title">
              <span>Rejected Paths</span>
              <span className="badge badge-red">{routeResult.rejected_routes.length} rejected</span>
            </div>
            {routeResult.rejected_routes.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
                All physical candidate paths met current constraints.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Path Candidate</th>
                    <th>Rejection Reasons</th>
                  </tr>
                </thead>
                <tbody>
                  {routeResult.rejected_routes.map((cand, idx) => (
                    <tr key={idx}>
                      <td className="font-mono" style={{ color: '#94a3b8' }}>{cand.path.join(' → ')}</td>
                      <td>
                        {cand.rejection_reasons.map((r, rIdx) => (
                          <div key={rIdx} style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                            • {r}
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
