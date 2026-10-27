import React from 'react';
import {
  NetworkTopology,
  RouteResponse,
  SimulationEvent,
  ExperimentListItem,
} from '../types/network';
import {
  Compass,
  Zap,
  History,
} from 'lucide-react';

interface OverviewPageProps {
  topology: NetworkTopology;
  routeResult: RouteResponse | null;
  addressFamily: 'ipv4' | 'ipv6';
  onSwitchFamily: (family: 'ipv4' | 'ipv6') => void;
  events: SimulationEvent[];
  latestExperiment: ExperimentListItem | null;
  onNavigate: (tab: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  topology,
  routeResult,
  addressFamily,
  onSwitchFamily,
  events,
  latestExperiment,
  onNavigate,
}) => {
  const selectedRoute = routeResult?.selected_route;
  const isReachable = routeResult?.destination_reachable ?? true;
  const activePathString = selectedRoute ? selectedRoute.path.join(' → ') : 'No Feasible Path Available';

  return (
    <div>
      {/* Top Welcome / Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Network Operations Center</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Real-time topology telemetry, dual-stack path state, and automated resilience metrics
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Routing Family:</span>
          <button
            className={`btn ${addressFamily === 'ipv4' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => onSwitchFamily('ipv4')}
          >
            IPv4
          </button>
          <button
            className={`btn ${addressFamily === 'ipv6' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => onSwitchFamily('ipv6')}
          >
            IPv6
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-label">Active Path Cost</div>
          <div className="metric-card-value">
            {selectedRoute ? selectedRoute.calculated_cost.toFixed(2) : '—'}
            <span className="metric-card-unit">QoS metric</span>
          </div>
          <div className="metric-card-sub">
            {isReachable ? '0.5·Lat + 20·Loss + 5·Hops' : 'Unreachable'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-label">Aggregate Latency</div>
          <div className="metric-card-value">
            {selectedRoute ? selectedRoute.total_latency.toFixed(1) : '—'}
            <span className="metric-card-unit">ms</span>
          </div>
          <div className="metric-card-sub">Sum of traversed link delays</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-label">End-to-End Packet Loss</div>
          <div className="metric-card-value">
            {selectedRoute ? selectedRoute.end_to_end_loss.toFixed(2) : '—'}
            <span className="metric-card-unit">%</span>
          </div>
          <div className="metric-card-sub">Independent link probability model</div>
        </div>

        <div className="metric-card">
          <div className="metric-card-label">Hop Count</div>
          <div className="metric-card-value">
            {selectedRoute ? selectedRoute.hop_count : '—'}
            <span className="metric-card-unit">hops</span>
          </div>
          <div className="metric-card-sub">
            Bottleneck: {selectedRoute ? `${selectedRoute.bottleneck_bandwidth}M` : '—'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-label">Network Health</div>
          <div className="metric-card-value" style={{ color: topology.active_links === topology.total_links ? '#34d399' : '#fbbf24' }}>
            {topology.active_links} / {topology.total_links}
            <span className="metric-card-unit">links up</span>
          </div>
          <div className="metric-card-sub">{topology.total_devices} devices online</div>
        </div>
      </div>

      {/* Main Grid: Active Path Summary & Recent Events */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Selected Route Panel */}
        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={18} color="#38bdf8" />
              Active Route ({addressFamily.toUpperCase()})
            </span>
            <span className={`badge ${selectedRoute ? 'badge-green' : 'badge-red'}`}>
              {selectedRoute ? 'OPTIMAL FEASIBLE ROUTE' : 'NO ROUTE AVAILABLE'}
            </span>
          </div>

          <div
            style={{
              background: '#090e1c',
              padding: '1rem',
              borderRadius: 8,
              fontFamily: 'JetBrains Mono',
              fontSize: '0.95rem',
              color: selectedRoute ? '#34d399' : '#f87171',
              marginBottom: '1rem',
              border: selectedRoute ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            {activePathString}
          </div>

          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1rem' }}>
            {routeResult?.selection_explanation || 'Evaluating network routes...'}
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('routing')}
              style={{ fontSize: '0.8rem' }}
            >
              Open Routing Lab
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('simulator')}
              style={{ fontSize: '0.8rem' }}
            >
              Simulate Link Outage
            </button>
          </div>
        </div>

        {/* Recent Simulation Timeline Panel */}
        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="#f59e0b" />
              Recent Network Events
            </span>
            <span className="badge badge-neutral">{events.length} logged</span>
          </div>

          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
              No failure or recovery events triggered yet in this session.
              <br />
              Use the Simulator or Routing Lab to test network resilience.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 240, overflowY: 'auto' }}>
              {events.slice(0, 6).map((ev, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#090e1c',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    borderLeft: ev.event_type.includes('fail')
                      ? '3px solid #ef4444'
                      : ev.event_type.includes('restore')
                      ? '3px solid #10b981'
                      : '3px solid #3b82f6',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                    <span>{ev.event_type.toUpperCase()}</span>
                    <span>{ev.timestamp}</span>
                  </div>
                  <div style={{ color: '#f8fafc', fontWeight: 500 }}>{ev.description}</div>
                  {ev.impact_summary && (
                    <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                      {ev.impact_summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Latest Experiment Summary Banner */}
      {latestExperiment && (
        <div className="panel" style={{ background: '#0b1329', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="#60a5fa" />
              Latest Saved Experiment: {latestExperiment.name}
            </span>
            <span className="badge badge-blue">
              {new Date(latestExperiment.created_at).toLocaleTimeString()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#cbd5e1' }}>
            <div>
              <span style={{ color: '#64748b' }}>Category:</span> {latestExperiment.category}
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Route:</span>{' '}
              <span className="font-mono">{latestExperiment.path_nodes || 'None'}</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Latency:</span> {latestExperiment.total_latency}ms
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Loss:</span> {latestExperiment.end_to_end_loss}%
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Cost:</span> {latestExperiment.calculated_cost}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('history')}
              style={{ marginLeft: 'auto', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >
              View Full History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
