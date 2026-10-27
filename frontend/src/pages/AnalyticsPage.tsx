import React, { useState, useEffect } from 'react';
import { ExperimentListItem, NetworkTopology, RouteResponse } from '../types/network';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Download,
  FileCheck,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';

interface AnalyticsPageProps {
  topology: NetworkTopology;
  currentRoute: RouteResponse | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ topology, currentRoute }) => {
  const [experiments, setExperiments] = useState<ExperimentListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.listExperiments();
        setExperiments(data);
      } catch (err) {
        console.error('Failed to fetch analytics experiments', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Format data for Recharts (limit to recent 8 for clean readability)
  const chartData = experiments.slice(0, 8).reverse().map((e) => ({
    name: e.name.length > 18 ? e.name.substring(0, 16) + '…' : e.name,
    fullName: e.name,
    latency: e.total_latency || 0,
    cost: e.calculated_cost || 0,
    loss: e.end_to_end_loss || 0,
    hops: e.hop_count || 0,
    stack: e.address_family.toUpperCase(),
  }));

  // Pie chart reachability data
  const reachableCount = experiments.filter((e) => e.destination_reachable).length;
  const unreachableCount = experiments.length - reachableCount;
  const reachabilityPie = [
    { name: 'Reachable Flows', value: reachableCount, color: '#10b981' },
    { name: 'Unreachable / Cut', value: unreachableCount, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
        <p>Loading telemetry and benchmark reports...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={22} color="#3b82f6" />
            Analytics & Comparative Evaluation Reports
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Empirical visualizations computed directly from persistent SQLite experiment data and active engine state.
          </p>
        </div>

        <a
          href={api.getExportCsvUrl()}
          download="dualstackroute_experiments.csv"
          className="btn btn-secondary"
          style={{ textDecoration: 'none' }}
        >
          <Download size={15} />
          <span>Export Analytics CSV</span>
        </a>
      </div>

      {experiments.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <Activity size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>No experiment data logged yet</p>
          <p style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
            Run routing optimizations in the Routing Lab and simulate link failures to generate charts.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row 1: Latency & Cost */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Latency Comparison Chart */}
            <div className="panel">
              <div className="panel-title">
                <span>Aggregate Path Latency across Experiments (ms)</span>
                <span className="badge badge-blue">Delay Analysis</span>
              </div>
              <div style={{ height: 260, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} unit="ms" />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: '0.78rem' }}
                    />
                    <Bar dataKey="latency" name="Latency (ms)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Route Cost Comparison Chart */}
            <div className="panel">
              <div className="panel-title">
                <span>Objective Route Cost Evaluation</span>
                <span className="badge badge-green">Composite QoS Cost</span>
              </div>
              <div style={{ height: 260, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: '0.78rem' }}
                    />
                    <Bar dataKey="cost" name="Route Cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Packet Loss & Reachability Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Packet Loss Trend */}
            <div className="panel">
              <div className="panel-title">
                <span>End-to-End Packet Loss (%)</span>
                <span className="badge badge-amber">Reliability</span>
              </div>
              <div style={{ height: 260, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} unit="%" />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: '0.78rem' }}
                    />
                    <Line type="monotone" dataKey="loss" name="Packet Loss (%)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Reachability Ratio Pie Chart */}
            <div className="panel">
              <div className="panel-title">
                <span>Experiment Connectivity Outcome</span>
                <span className="badge badge-neutral">Resilience Ratio</span>
              </div>
              <div style={{ height: 260, width: '100%', display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reachabilityPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reachabilityPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: '0.78rem' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Structured Synthesis Report View */}
      <div className="panel">
        <div className="panel-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={18} color="#34d399" />
            Current Session Network Evaluation Report
          </span>
          <span className="badge badge-green">Live Executive Summary</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
          <div style={{ background: '#090e1c', padding: '0.85rem', borderRadius: 6 }}>
            <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>TOPOLOGY STATUS</div>
            <div style={{ fontWeight: 600 }}>{topology.total_devices} Devices ({topology.active_links}/{topology.total_links} Links Up)</div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>
              Dual-Stack IPv4 / IPv6 Transit Infrastructure
            </div>
          </div>

          <div style={{ background: '#090e1c', padding: '0.85rem', borderRadius: 6 }}>
            <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>ACTIVE ROUTE</div>
            <div className="font-mono" style={{ fontWeight: 600, color: '#34d399' }}>
              {currentRoute?.selected_route ? currentRoute.selected_route.path.join(' → ') : 'No Feasible Route'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>
              Cost: {currentRoute?.selected_route?.calculated_cost.toFixed(2) || 'N/A'}
            </div>
          </div>

          <div style={{ background: '#090e1c', padding: '0.85rem', borderRadius: 6 }}>
            <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>QoS PERFORMANCE</div>
            <div style={{ fontWeight: 600 }}>
              {currentRoute?.selected_route?.total_latency.toFixed(1)}ms | {currentRoute?.selected_route?.end_to_end_loss.toFixed(2)}% Loss
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>
              Bottleneck: {currentRoute?.selected_route?.bottleneck_bandwidth} Mbps
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          <strong>Academic Simulation Limitations:</strong>
          <p style={{ marginTop: '0.25rem', color: '#94a3b8' }}>
            This platform models network graphs deterministically using NetworkX and calculates composite QoS route weights using the documented educational cost equation. Link convergence and failover times are calculated through discrete graph evaluations and are not claimed to replicate ASIC hardware line cards, BFD timers, or production BGP/OSPF convergence dynamics.
          </p>
        </div>
      </div>
    </div>
  );
};
