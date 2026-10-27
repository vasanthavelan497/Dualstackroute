import React, { useState } from 'react';
import {
  NetworkTopology,
  RouteResponse,
  SimulationEvent,
  ExperimentCreate,
} from '../types/network';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  Save,
  Clock,
  Radio,
} from 'lucide-react';

interface FailureSimulatorPageProps {
  topology: NetworkTopology;
  routeResult: RouteResponse | null;
  onFailLink: (linkId: string) => Promise<void>;
  onRestoreLink: (linkId: string) => Promise<void>;
  onResetTopology: () => Promise<void>;
  onSaveExperiment: (exp: ExperimentCreate) => Promise<void>;
  events: SimulationEvent[];
  loading: boolean;
}

export const FailureSimulatorPage: React.FC<FailureSimulatorPageProps> = ({
  topology,
  routeResult,
  onFailLink,
  onRestoreLink,
  onResetTopology,
  onSaveExperiment,
  events,
  loading,
}) => {
  const [selectedLinkId, setSelectedLinkId] = useState<string>('L2');
  const [simulating, setSimulating] = useState<boolean>(false);

  // Before & After snapshots for failover comparison
  const [beforeSnapshot, setBeforeSnapshot] = useState<RouteResponse | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const targetLink = topology.links.find((l) => l.id === selectedLinkId);
  const isTargetUp = targetLink?.status === 'up';

  const handleFailAction = async () => {
    if (!targetLink) return;
    setSimulating(true);
    // Snapshot current route before failure
    setBeforeSnapshot(routeResult);
    setLastAction(`Fail ${targetLink.name} (${targetLink.id})`);

    try {
      await onFailLink(targetLink.id);
    } catch (err: any) {
      alert(`Error failing link: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleRestoreAction = async () => {
    if (!targetLink) return;
    setSimulating(true);
    // Snapshot current route before restoration
    setBeforeSnapshot(routeResult);
    setLastAction(`Restore ${targetLink.name} (${targetLink.id})`);

    try {
      await onRestoreLink(targetLink.id);
    } catch (err: any) {
      alert(`Error restoring link: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveSimulation = async () => {
    if (!routeResult) return;
    try {
      await onSaveExperiment({
        name: `Resilience Test: ${lastAction || 'Link Outage'}`,
        category: 'failure_simulation',
        address_family: routeResult.address_family,
        source: routeResult.source,
        destination: routeResult.destination,
        topology_snapshot: topology,
        selected_route: routeResult.selected_route,
        before_metrics: beforeSnapshot?.selected_route,
        after_metrics: routeResult.selected_route,
        event_timeline: events.slice(0, 10),
        summary_explanation: `Simulated ${lastAction}. Active path: ${
          routeResult.selected_route?.path.join(' → ') || 'Unreachable'
        }.`,
      });
      alert('Resilience experiment saved to SQLite database!');
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    }
  };

  const currentRoute = routeResult?.selected_route;
  const previousRoute = beforeSnapshot?.selected_route;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={22} color="#f59e0b" />
            Failure & Recovery Simulator
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Inject link disruptions, verify autonomous path rerouting, and examine failover performance telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onResetTopology} disabled={loading || simulating}>
            <RotateCcw size={15} />
            <span>Reset Baseline Scenario</span>
          </button>
        </div>
      </div>

      {/* Simulator Control Center */}
      <div className="panel" style={{ marginBottom: '1.5rem', background: '#0e172a', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <div className="panel-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
            <Radio size={18} />
            Fault Injection Console
          </span>
          {targetLink && (
            <span className={`badge ${isTargetUp ? 'badge-green' : 'badge-red'}`}>
              STATUS: {targetLink.status.toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ minWidth: 280, marginBottom: 0, flex: 1 }}>
            <label className="input-label">Select Target Link to Disrupt / Restore</label>
            <select
              className="select-input"
              value={selectedLinkId}
              onChange={(e) => setSelectedLinkId(e.target.value)}
            >
              {topology.links.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id}: {l.name} [{l.source} ↔ {l.target}] ({l.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-danger"
            onClick={handleFailAction}
            disabled={!isTargetUp || simulating || loading}
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <ShieldAlert size={16} />
            <span>Simulate Link Cut (Fail Link)</span>
          </button>

          <button
            className="btn btn-success"
            onClick={handleRestoreAction}
            disabled={isTargetUp || simulating || loading}
            style={{ padding: '0.65rem 1.25rem' }}
          >
            <CheckCircle2 size={16} />
            <span>Restore Link Connection</span>
          </button>

          {lastAction && (
            <button
              className="btn btn-primary"
              onClick={handleSaveSimulation}
              style={{ padding: '0.65rem 1.25rem' }}
            >
              <Save size={16} />
              <span>Persist Resilience Run</span>
            </button>
          )}
        </div>

        <div style={{ marginTop: '0.85rem', fontSize: '0.78rem', color: '#94a3b8' }}>
          Note: Failover recovery times in this academic platform are educational model projections and not hardware convergence benchmarks.
        </div>
      </div>

      {/* Before and After Telemetry Diff Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Pre-Event State */}
        <div className="panel">
          <div className="panel-title">
            <span style={{ color: '#94a3b8' }}>Pre-Event Baseline State</span>
            <span className="badge badge-neutral">Before</span>
          </div>

          {previousRoute ? (
            <div>
              <div
                className="font-mono"
                style={{
                  padding: '0.75rem',
                  background: '#090e1c',
                  borderRadius: 6,
                  color: '#cbd5e1',
                  marginBottom: '1rem',
                  fontSize: '0.88rem',
                }}
              >
                {previousRoute.path.join(' → ')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
                <div style={{ background: '#090e1c', padding: '0.6rem', borderRadius: 6 }}>
                  <div style={{ color: '#64748b' }}>Latency:</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{previousRoute.total_latency.toFixed(1)} ms</div>
                </div>
                <div style={{ background: '#090e1c', padding: '0.6rem', borderRadius: 6 }}>
                  <div style={{ color: '#64748b' }}>Packet Loss:</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fbbf24' }}>
                    {previousRoute.end_to_end_loss.toFixed(2)} %
                  </div>
                </div>
                <div style={{ background: '#090e1c', padding: '0.6rem', borderRadius: 6 }}>
                  <div style={{ color: '#64748b' }}>Composite Cost:</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#60a5fa' }}>
                    {previousRoute.calculated_cost.toFixed(2)}
                  </div>
                </div>
                <div style={{ background: '#090e1c', padding: '0.6rem', borderRadius: 6 }}>
                  <div style={{ color: '#64748b' }}>Hops:</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{previousRoute.hop_count}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              Execute a failure or recovery action above to record pre-event metrics.
            </div>
          )}
        </div>

        {/* Post-Event / Current State */}
        <div className="panel" style={{ borderLeft: currentRoute ? '4px solid #10b981' : '4px solid #ef4444' }}>
          <div className="panel-title">
            <span style={{ color: currentRoute ? '#34d399' : '#f87171' }}>
              {lastAction ? `Active State (${lastAction})` : 'Current Routing State'}
            </span>
            <span className={`badge ${currentRoute ? 'badge-green' : 'badge-red'}`}>
              {currentRoute ? 'RE-CONVERGED' : 'NETWORK PARTITIONED'}
            </span>
          </div>

          {currentRoute ? (
            <div>
              <div
                className="font-mono"
                style={{
                  padding: '0.75rem',
                  background: '#090e1c',
                  borderRadius: 6,
                  color: '#34d399',
                  marginBottom: '1rem',
                  fontSize: '0.88rem',
                }}
              >
                {currentRoute.path.join(' → ')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
                <div style={{ background: '#090e1c', padding: '0.6rem', borderRadius: 6 }}>
                  <div style={{ color: '#64748b' }}>Latency:</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {currentRoute.total_latency.toFixed(1)} ms
                    {previousRoute && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          marginLeft: '0.4rem',
                          color: currentRoute.total_latency > previousRoute.total_latency ? '#f87171' : '#34d399',
                        }}
                      >
                        ({currentRoute.total_latency >= previousRoute.total_latency ? '+' : ''}
                        {(currentRoute.total_latency - previousRoute.total_latency).toFixed(1)}ms)
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ background: '#090e1c', padding: '0.6rem', borderRadius: 6 }}>
                  <div style={{ color: '#64748b' }}>Packet Loss:</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fbbf24' }}>
                    {currentRoute.end_to_end_loss.toFixed(2)} %
                  </div>
                </div>

                <div style={{ background: '#090e1c', padding: '0.6rem', borderRadius: 6 }}>
                  <div style={{ color: '#64748b' }}>Composite Cost:</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#60a5fa' }}>
                    {currentRoute.calculated_cost.toFixed(2)}
                  </div>
                </div>

                <div style={{ background: '#090e1c', padding: '0.6rem', borderRadius: 6 }}>
                  <div style={{ color: '#64748b' }}>Hops:</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{currentRoute.hop_count}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#f87171' }}>
              <XCircle size={36} style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontWeight: 600 }}>Destination Unreachable</div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                All feasible routes traversing intermediate routers have experienced link cuts.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event Timeline Table */}
      <div className="panel">
        <div className="panel-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="#60a5fa" />
            Resilience Event Log & Failover Audit Trail
          </span>
          <span className="badge badge-neutral">{events.length} Events</span>
        </div>

        {events.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem' }}>
            No simulated failures or restorations have been recorded yet.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Target Resource</th>
                <th>Description</th>
                <th>Telemetry Impact</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, idx) => (
                <tr key={idx}>
                  <td className="font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{ev.timestamp}</td>
                  <td>
                    <span
                      className={`badge ${
                        ev.event_type.includes('fail')
                          ? 'badge-red'
                          : ev.event_type.includes('restore')
                          ? 'badge-green'
                          : 'badge-blue'
                      }`}
                    >
                      {ev.event_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>{ev.target_id || 'Global'}</td>
                  <td>{ev.description}</td>
                  <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{ev.impact_summary || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
