import React from 'react';
import { Activity, Network, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface HeaderProps {
  backendConnected: boolean;
  addressFamily: 'ipv4' | 'ipv6';
  activeLinksCount: number;
  totalLinksCount: number;
  onRefresh: () => void;
  loading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  backendConnected,
  addressFamily,
  activeLinksCount,
  totalLinksCount,
  onRefresh,
  loading,
}) => {
  return (
    <header className="header-bar">
      <div className="header-left">
        <div className="brand-badge">
          <Network size={20} />
          <span>DUALSTACKROUTE</span>
        </div>
        <div className="header-title-group">
          <h1>Intelligent Dual-Stack Routing & Resilience Platform</h1>
          <p>Deterministic IPv4/IPv6 QoS Optimization & Automated Failover Engine</p>
        </div>
      </div>

      <div className="header-status-group">
        {/* Backend health status badge */}
        <div className={`badge ${backendConnected ? 'badge-green' : 'badge-red'}`}>
          {backendConnected ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
          <span>{backendConnected ? 'Engine Online' : 'Engine Disconnected'}</span>
        </div>

        {/* Address Family indicator */}
        <div className={`badge ${addressFamily === 'ipv4' ? 'badge-cyan' : 'badge-blue'}`}>
          <Activity size={14} />
          <span>Mode: {addressFamily.toUpperCase()}</span>
        </div>

        {/* Connectivity ratio */}
        <div className="badge badge-neutral">
          <span>Links: {activeLinksCount}/{totalLinksCount} Up</span>
        </div>

        {/* Refresh button */}
        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Network State from Backend"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>
      </div>
    </header>
  );
};
