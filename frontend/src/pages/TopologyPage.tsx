import React from 'react';
import { NetworkTopology, CandidatePath, LinkUpdate } from '../types/network';
import { TopologyGraph } from '../components/TopologyGraph';
import { GitBranch, Layers, ShieldCheck, AlertCircle } from 'lucide-react';

interface TopologyPageProps {
  topology: NetworkTopology;
  selectedRoute: CandidatePath | null;
  addressFamily: 'ipv4' | 'ipv6';
  onUpdateLink: (linkId: string, update: LinkUpdate) => Promise<void>;
  onFailLink: (linkId: string) => Promise<void>;
  onRestoreLink: (linkId: string) => Promise<void>;
  onResetTopology: () => Promise<void>;
}

export const TopologyPage: React.FC<TopologyPageProps> = ({
  topology,
  selectedRoute,
  addressFamily,
  onUpdateLink,
  onFailLink,
  onRestoreLink,
  onResetTopology,
}) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitBranch size={22} color="#3b82f6" />
            Interactive Network Topology
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Explore device interfaces, adjust link parameters, and inspect dual-stack forwarding paths in real time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="badge badge-neutral">
            <span>Graph Nodes: {topology.total_devices}</span>
          </div>
          <div className="badge badge-neutral">
            <span>Links: {topology.total_links}</span>
          </div>
          <div className={`badge ${topology.active_links === topology.total_links ? 'badge-green' : 'badge-amber'}`}>
            <span>{topology.active_links} Active</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <TopologyGraph
        topology={topology}
        selectedRoute={selectedRoute}
        addressFamily={addressFamily}
        onUpdateLink={onUpdateLink}
        onFailLink={onFailLink}
        onRestoreLink={onRestoreLink}
        onResetTopology={onResetTopology}
      />

      {/* Topology Structure Reference Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        <div className="panel">
          <div className="panel-title">
            <span style={{ fontSize: '0.9rem', color: '#60a5fa' }}>Primary Gigabit Backbone</span>
            <span className="badge badge-blue">Path 1</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong style={{ color: '#f8fafc' }}>PC1 → R1 → R2 → R4 → PC2</strong>
            <br />
            Configured with 1000 Mbps line-rate transit via core router R2. Offers baseline 40ms aggregate latency and minimal 0.2% cumulative packet loss.
          </p>
        </div>

        <div className="panel">
          <div className="panel-title">
            <span style={{ fontSize: '0.9rem', color: '#fbbf24' }}>Alternate Resilient Transit</span>
            <span className="badge badge-amber">Path 2</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            <strong style={{ color: '#f8fafc' }}>PC1 → R1 → R3 → R4 → PC2</strong>
            <br />
            Secondary 500 Mbps backup route routed via core router R3. Delivers 60ms aggregate latency and provides automatic failover when primary links degrade.
          </p>
        </div>

        <div className="panel">
          <div className="panel-title">
            <span style={{ fontSize: '0.9rem', color: '#a78bfa' }}>Inter-Router Link R2 ↔ R3</span>
            <span className="badge badge-neutral">Cross Link L6</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Allows complex mesh rerouting (e.g., PC1-R1-R2-R3-R4-PC2) when downstream egress links experience localized failure.
          </p>
        </div>
      </div>
    </div>
  );
};
