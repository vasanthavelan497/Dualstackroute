import React, { useState, useEffect } from 'react';
import {
  ExperimentListItem,
  ExperimentDetail,
  ExperimentCompareResponse,
} from '../types/network';
import { api } from '../services/api';
import {
  History,
  Download,
  Trash2,
  Search,
  Eye,
  GitCompare,
  X,
  FileText,
} from 'lucide-react';

interface ExperimentHistoryPageProps {
  onRefresh: () => void;
}

export const ExperimentHistoryPage: React.FC<ExperimentHistoryPageProps> = () => {
  const [experiments, setExperiments] = useState<ExperimentListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [detailExp, setDetailExp] = useState<ExperimentDetail | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ExperimentCompareResponse | null>(null);
  const [comparing, setComparing] = useState<boolean>(false);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const data = await api.listExperiments(category, search);
      setExperiments(data);
    } catch (err: any) {
      console.error('Failed to fetch experiments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExperiments();
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleViewDetail = async (id: string) => {
    try {
      const detail = await api.getExperiment(id);
      setDetailExp(detail);
    } catch (err: any) {
      alert(`Could not load experiment details: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experiment record?')) return;
    try {
      await api.deleteExperiment(id);
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      fetchExperiments();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('WARNING: This will permanently erase ALL experiment records in SQLite. Proceed?')) return;
    try {
      await api.clearAllExperiments();
      setSelectedIds([]);
      fetchExperiments();
    } catch (err: any) {
      alert(`Clear failed: ${err.message}`);
    }
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      alert('Please select at least 2 experiments to compare.');
      return;
    }
    setComparing(true);
    try {
      const res = await api.compareExperiments(selectedIds);
      setComparisonResult(res);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={22} color="#60a5fa" />
            Experiment History & Audit Records
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Persistent SQLite telemetry archives for QoS routing scenarios, failure simulations, and comparative studies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a
            href={api.getExportCsvUrl()}
            download="dualstackroute_experiments.csv"
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </a>

          <button
            className="btn btn-primary"
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || comparing}
          >
            <GitCompare size={15} />
            <span>Compare Selected ({selectedIds.length})</span>
          </button>

          <button
            className="btn btn-danger"
            onClick={handleClearAll}
            disabled={experiments.length === 0}
          >
            <Trash2 size={15} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 240 }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search experiments by name, route, or summary..."
              className="text-input"
              style={{ width: '100%', padding: '0.45rem 0.75rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Category:</span>
            <select
              className="select-input"
              style={{ padding: '0.45rem 0.75rem' }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="routing_lab">Routing Optimization</option>
              <option value="failure_simulation">Failure & Recovery</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ padding: '0.45rem 0.85rem' }}>
            Search
          </button>
        </form>
      </div>

      {/* Experiment Data Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading experiment records from SQLite database...
          </div>
        ) : experiments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <FileText size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <p>No experiment records found in persistent storage.</p>
            <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
              Run simulations or routing optimizations and click "Persist Experiment" to archive results.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>Select</th>
                  <th>Timestamp</th>
                  <th>Experiment Name</th>
                  <th>Category</th>
                  <th>Stack</th>
                  <th>Path</th>
                  <th>Latency</th>
                  <th>Loss</th>
                  <th>Hops</th>
                  <th>Cost</th>
                  <th>Reachability</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => {
                  const isChecked = selectedIds.includes(exp.id);
                  return (
                    <tr key={exp.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(exp.id)}
                          style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                        />
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(exp.created_at).toLocaleDateString()} {new Date(exp.created_at).toLocaleTimeString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{exp.name}</td>
                      <td>
                        <span className={`badge ${exp.category.includes('fail') ? 'badge-amber' : 'badge-blue'}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${exp.address_family === 'ipv4' ? 'badge-cyan' : 'badge-blue'}`}>
                          {exp.address_family.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                        {exp.path_nodes || 'None'}
                      </td>
                      <td>{exp.total_latency != null ? `${exp.total_latency.toFixed(1)}ms` : '—'}</td>
                      <td>{exp.end_to_end_loss != null ? `${exp.end_to_end_loss.toFixed(2)}%` : '—'}</td>
                      <td>{exp.hop_count ?? '—'}</td>
                      <td>
                        {exp.calculated_cost != null ? (
                          <span className="badge badge-green">{exp.calculated_cost.toFixed(2)}</span>
                        ) : '—'}
                      </td>
                      <td>
                        {exp.destination_reachable ? (
                          <span className="badge badge-green">Reachable</span>
                        ) : (
                          <span className="badge badge-red">Unreachable</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginRight: '0.35rem' }}
                          onClick={() => handleViewDetail(exp.id)}
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDelete(exp.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Experiment Detail Modal */}
      {detailExp && (
        <div className="modal-overlay" onClick={() => setDetailExp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{detailExp.name}</h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  ID: {detailExp.id} | Recorded: {new Date(detailExp.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setDetailExp(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#090e1c', padding: '0.65rem', borderRadius: 6 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>STACK</div>
                <div style={{ fontWeight: 700 }}>{detailExp.address_family.toUpperCase()}</div>
              </div>
              <div style={{ background: '#090e1c', padding: '0.65rem', borderRadius: 6 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>LATENCY</div>
                <div style={{ fontWeight: 700 }}>{detailExp.total_latency?.toFixed(1) || '—'} ms</div>
              </div>
              <div style={{ background: '#090e1c', padding: '0.65rem', borderRadius: 6 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>PACKET LOSS</div>
                <div style={{ fontWeight: 700, color: '#fbbf24' }}>{detailExp.end_to_end_loss?.toFixed(2) || '—'} %</div>
              </div>
              <div style={{ background: '#090e1c', padding: '0.65rem', borderRadius: 6 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>HOPS</div>
                <div style={{ fontWeight: 700 }}>{detailExp.hop_count ?? '—'}</div>
              </div>
              <div style={{ background: '#090e1c', padding: '0.65rem', borderRadius: 6 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>COMPOSITE COST</div>
                <div style={{ fontWeight: 700, color: '#34d399' }}>{detailExp.calculated_cost?.toFixed(2) || '—'}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>Selected Path:</div>
              <div className="font-mono" style={{ background: '#090e1c', padding: '0.65rem', borderRadius: 6, color: '#34d399' }}>
                {detailExp.path_nodes || 'No Path'}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>Summary Explanation:</div>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, background: '#090e1c', padding: '0.65rem', borderRadius: 6 }}>
                {detailExp.summary_explanation}
              </p>
            </div>

            {/* Event Timeline if present */}
            {detailExp.event_timeline && detailExp.event_timeline.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.25rem' }}>Associated Event Timeline:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 180, overflowY: 'auto' }}>
                  {detailExp.event_timeline.map((ev, i) => (
                    <div key={i} style={{ background: '#090e1c', padding: '0.5rem', borderRadius: 4, fontSize: '0.75rem' }}>
                      <span className="font-mono" style={{ color: '#94a3b8', marginRight: '0.5rem' }}>{ev.timestamp}</span>
                      <strong style={{ color: '#38bdf8' }}>[{ev.event_type}]</strong> {ev.description}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {comparisonResult && (
        <div className="modal-overlay" onClick={() => setComparisonResult(null)}>
          <div className="modal-content" style={{ maxWidth: 850 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Side-by-Side Experiment Comparison</h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Comparing {comparisonResult.items.length} selected runs
                </p>
              </div>
              <button
                onClick={() => setComparisonResult(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Comparison Metrics Grid */}
            <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {comparisonResult.items.map((item) => (
                      <th key={item.experiment_id} style={{ minWidth: 160 }}>
                        {item.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>Category</td>
                    {comparisonResult.items.map((item) => (
                      <td key={item.experiment_id}>{item.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>Protocol Stack</td>
                    {comparisonResult.items.map((item) => (
                      <td key={item.experiment_id}>{item.address_family.toUpperCase()}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>Selected Route</td>
                    {comparisonResult.items.map((item) => (
                      <td key={item.experiment_id} className="font-mono" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                        {item.path_nodes || 'None'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>Latency (ms)</td>
                    {comparisonResult.items.map((item) => (
                      <td key={item.experiment_id} style={{ fontWeight: 700 }}>
                        {item.total_latency?.toFixed(1) || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>Packet Loss (%)</td>
                    {comparisonResult.items.map((item) => (
                      <td key={item.experiment_id} style={{ fontWeight: 700, color: '#fbbf24' }}>
                        {item.end_to_end_loss?.toFixed(2) || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>Hop Count</td>
                    {comparisonResult.items.map((item) => (
                      <td key={item.experiment_id}>{item.hop_count ?? '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>Calculated Cost</td>
                    {comparisonResult.items.map((item) => (
                      <td key={item.experiment_id} style={{ fontWeight: 700, color: '#34d399' }}>
                        {item.calculated_cost?.toFixed(2) || '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#94a3b8' }}>Reachability</td>
                    {comparisonResult.items.map((item) => (
                      <td key={item.experiment_id}>
                        {item.destination_reachable ? (
                          <span className="badge badge-green">Reachable</span>
                        ) : (
                          <span className="badge badge-red">Unreachable</span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Analysis Insights */}
            <div className="panel" style={{ background: '#090e1c' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.5rem' }}>
                Comparative Insights:
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                {comparisonResult.analysis_insights.map((ins, i) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
