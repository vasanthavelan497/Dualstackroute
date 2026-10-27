import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { OverviewPage } from './pages/OverviewPage';
import { TopologyPage } from './pages/TopologyPage';
import { RoutingLabPage } from './pages/RoutingLabPage';
import { FailureSimulatorPage } from './pages/FailureSimulatorPage';
import { DualStackInspectorPage } from './pages/DualStackInspectorPage';
import { ExperimentHistoryPage } from './pages/ExperimentHistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ConceptsPage } from './pages/ConceptsPage';
import { api } from './services/api';
import {
  NetworkTopology,
  RouteResponse,
  RouteRequest,
  LinkUpdate,
  SimulationEvent,
  ExperimentListItem,
  ExperimentCreate,
} from './types/network';

const initialTopology: NetworkTopology = {
  devices: [],
  links: [],
  scenario_version: '1.0.0',
  total_devices: 0,
  total_links: 0,
  active_links: 0,
  connected_components: 0,
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [topology, setTopology] = useState<NetworkTopology>(initialTopology);
  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [addressFamily, setAddressFamily] = useState<'ipv4' | 'ipv6'>('ipv4');
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [latestExperiment, setLatestExperiment] = useState<ExperimentListItem | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const addEvent = useCallback((eventType: string, description: string, targetId?: string, impact?: string) => {
    const newEvent: SimulationEvent = {
      timestamp: new Date().toLocaleTimeString(),
      event_type: eventType,
      target_id: targetId,
      description,
      impact_summary: impact,
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
  }, []);

  // Compute baseline or updated route
  const computeRoute = useCallback(async (
    family: 'ipv4' | 'ipv6',
    src: string = 'PC1',
    dst: string = 'PC2'
  ) => {
    try {
      const res = await api.calculateRoute({
        source: src,
        destination: dst,
        address_family: family,
      });
      setRouteResult(res);
      return res;
    } catch (err: any) {
      console.warn('Route calculation error:', err);
      return null;
    }
  }, []);

  // Fetch full state from backend
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Health check
      await api.checkHealth();
      setBackendConnected(true);

      // 2. Topology
      const topo = await api.getTopology();
      setTopology(topo);

      // 3. Route
      await computeRoute(addressFamily);

      // 4. Experiments
      try {
        const exps = await api.listExperiments();
        if (exps && exps.length > 0) {
          setLatestExperiment(exps[0]);
        }
      } catch {
        // Non-critical if experiments are empty
      }
    } catch (err: any) {
      console.error('Failed to connect to backend engine:', err);
      setBackendConnected(false);
      showToast(`Cannot reach backend engine at ${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}. Start the backend server to enable dynamic routing.`, 'error');
    } finally {
      setLoading(false);
    }
  }, [addressFamily, computeRoute]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle switching address family
  const handleSwitchFamily = async (fam: 'ipv4' | 'ipv6') => {
    setAddressFamily(fam);
    addEvent('FAMILY_SWITCH', `Switched routing context to ${fam.toUpperCase()}`, undefined, `Now calculating metric weights and routing for ${fam.toUpperCase()}`);
    await computeRoute(fam);
  };

  // Handle calculate route with custom constraints/weights
  const handleCalculateRoute = async (req: RouteRequest) => {
    setLoading(true);
    try {
      const res = await api.calculateRoute(req);
      setRouteResult(res);
      setAddressFamily(req.address_family);
      const pathStr = res.selected_route ? res.selected_route.path.join(' → ') : 'No Feasible Path';
      addEvent(
        'ROUTE_CALCULATED',
        `Calculated ${req.address_family.toUpperCase()} route from ${req.source} to ${req.destination}`,
        req.source,
        `Selected: ${pathStr} (Cost: ${res.selected_route?.calculated_cost.toFixed(2) ?? 'N/A'}, Latency: ${res.selected_route?.total_latency.toFixed(1) ?? 'N/A'}ms)`
      );
      showToast(`Computed ${req.address_family.toUpperCase()} path: ${pathStr}`, 'success');
    } catch (err: any) {
      showToast(`Route calculation failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle link updates
  const handleUpdateLink = async (linkId: string, update: LinkUpdate) => {
    setLoading(true);
    try {
      const updatedLink = await api.updateLink(linkId, update);
      const topo = await api.getTopology();
      setTopology(topo);
      addEvent('LINK_MODIFIED', `Updated metrics for Link ${linkId}`, linkId, `Latency: ${updatedLink.latency}ms, Loss: ${updatedLink.packet_loss}%, Cost: ${updatedLink.cost}`);
      showToast(`Link ${linkId} telemetry updated successfully`, 'success');
      await computeRoute(addressFamily);
    } catch (err: any) {
      showToast(`Failed to update link ${linkId}: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle link failure simulation
  const handleFailLink = async (linkId: string) => {
    setLoading(true);
    try {
      await api.failLink(linkId);
      const topo = await api.getTopology();
      setTopology(topo);
      addEvent('LINK_DOWN', `Interface Link ${linkId} severed (State: DOWN)`, linkId, 'Traffic rerouted around degraded segment if alternative path exists');
      showToast(`Simulated fault on Link ${linkId} (DOWN)`, 'error');
      await computeRoute(addressFamily);
    } catch (err: any) {
      showToast(`Failed to fail link: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle link restoration
  const handleRestoreLink = async (linkId: string) => {
    setLoading(true);
    try {
      await api.restoreLink(linkId);
      const topo = await api.getTopology();
      setTopology(topo);
      addEvent('LINK_UP', `Interface Link ${linkId} restored (State: UP)`, linkId, 'Link returned to active operational state');
      showToast(`Restored Link ${linkId} (UP)`, 'success');
      await computeRoute(addressFamily);
    } catch (err: any) {
      showToast(`Failed to restore link: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle topology reset
  const handleResetTopology = async () => {
    setLoading(true);
    try {
      const topo = await api.resetTopology();
      setTopology(topo);
      addEvent('TOPOLOGY_RESET', 'Network topology restored to RFC baseline scenario', undefined, 'All links UP with default QoS parameters');
      showToast('Topology reset to baseline scenario', 'info');
      await computeRoute(addressFamily);
    } catch (err: any) {
      showToast(`Failed to reset topology: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle saving experiment
  const handleSaveExperiment = async (exp: ExperimentCreate) => {
    try {
      const saved = await api.createExperiment(exp);
      setLatestExperiment(saved);
      const fam = exp.address_family ? exp.address_family.toUpperCase() : 'IPV4';
      addEvent('EXPERIMENT_SAVED', `Archived benchmark run "${exp.name}"`, saved.id, `ID: ${saved.id.slice(0, 8)}... (${fam})`);
      showToast(`Experiment "${exp.name}" archived successfully!`, 'success');
    } catch (err: any) {
      showToast(`Failed to save experiment: ${err.message}`, 'error');
      throw err;
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        backendConnected={backendConnected}
        addressFamily={addressFamily}
        activeLinksCount={topology.active_links}
        totalLinksCount={topology.total_links}
        onRefresh={refreshAll}
        loading={loading}
      />

      {/* Navigation Bar */}
      <Navigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            backgroundColor:
              toastMessage.type === 'success'
                ? '#065f46'
                : toastMessage.type === 'error'
                ? '#991b1b'
                : '#1e293b',
            color: '#ffffff',
            border: `1px solid ${
              toastMessage.type === 'success'
                ? '#10b981'
                : toastMessage.type === 'error'
                ? '#ef4444'
                : '#3b82f6'
            }`,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            maxWidth: '480px',
            animation: 'fadeIn 0.2s ease-in-out',
          }}
        >
          <span>{toastMessage.message}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1rem',
              lineHeight: 1,
              opacity: 0.8,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Disconnected Notice if backend is offline */}
      {!backendConnected && !loading && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.6rem 2rem',
            fontSize: '0.85rem',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            ⚠️ Backend service is unreachable on port 8000. Launch backend server with{' '}
            <code>uvicorn backend.app.main:app --reload</code> to enable routing calculations and experiment logging.
          </span>
          <button
            onClick={refreshAll}
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'overview' && (
          <OverviewPage
            topology={topology}
            routeResult={routeResult}
            addressFamily={addressFamily}
            onSwitchFamily={handleSwitchFamily}
            events={events}
            latestExperiment={latestExperiment}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'topology' && (
          <TopologyPage
            topology={topology}
            selectedRoute={routeResult?.selected_route ?? null}
            addressFamily={addressFamily}
            onUpdateLink={handleUpdateLink}
            onFailLink={handleFailLink}
            onRestoreLink={handleRestoreLink}
            onResetTopology={handleResetTopology}
          />
        )}

        {activeTab === 'routing' && (
          <RoutingLabPage
            topology={topology}
            routeResult={routeResult}
            onCalculateRoute={handleCalculateRoute}
            onResetTopology={handleResetTopology}
            onSaveExperiment={handleSaveExperiment}
            loading={loading}
          />
        )}

        {activeTab === 'simulator' && (
          <FailureSimulatorPage
            topology={topology}
            routeResult={routeResult}
            onFailLink={handleFailLink}
            onRestoreLink={handleRestoreLink}
            onResetTopology={handleResetTopology}
            onSaveExperiment={handleSaveExperiment}
            events={events}
            loading={loading}
          />
        )}

        {activeTab === 'dualstack' && (
          <DualStackInspectorPage
            topology={topology}
            addressFamily={addressFamily}
            onSwitchFamily={handleSwitchFamily}
          />
        )}

        {activeTab === 'history' && (
          <ExperimentHistoryPage onRefresh={refreshAll} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage topology={topology} currentRoute={routeResult} />
        )}

        {activeTab === 'concepts' && <ConceptsPage />}
      </main>
    </div>
  );
};

export default App;
