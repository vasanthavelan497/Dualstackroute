import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Sliders,
  AlertTriangle,
  Layers,
  History,
  BarChart3,
  BookOpen,
} from 'lucide-react';

export type TabId =
  | 'overview'
  | 'topology'
  | 'routing'
  | 'simulator'
  | 'dualstack'
  | 'history'
  | 'analytics'
  | 'concepts';

interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: LayoutDashboard },
    { id: 'topology' as TabId, label: 'Network Topology', icon: GitBranch },
    { id: 'routing' as TabId, label: 'Routing Lab', icon: Sliders },
    { id: 'simulator' as TabId, label: 'Failure & Recovery Simulator', icon: AlertTriangle },
    { id: 'dualstack' as TabId, label: 'Dual-Stack IPv4/IPv6', icon: Layers },
    { id: 'history' as TabId, label: 'Experiment History', icon: History },
    { id: 'analytics' as TabId, label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'concepts' as TabId, label: 'Network Concepts', icon: BookOpen },
  ];

  return (
    <nav className="nav-container">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
            <Icon size={16} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
