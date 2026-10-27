import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { Navigation } from '../components/Navigation';
import { Header } from '../components/Header';
import { ConceptsPage } from '../pages/ConceptsPage';

describe('Navigation component', () => {
  it('renders all tab items correctly', () => {
    const onSelectTab = vi.fn();
    render(<Navigation activeTab="overview" onSelectTab={onSelectTab} />);

    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Network Topology')).toBeDefined();
    expect(screen.getByText('Routing Lab')).toBeDefined();
    expect(screen.getByText('Failure & Recovery Simulator')).toBeDefined();
    expect(screen.getByText('Dual-Stack IPv4/IPv6')).toBeDefined();
    expect(screen.getByText('Experiment History')).toBeDefined();
    expect(screen.getByText('Analytics & Reports')).toBeDefined();
    expect(screen.getByText('Network Concepts')).toBeDefined();
  });

  it('triggers onSelectTab when a tab button is clicked', () => {
    const onSelectTab = vi.fn();
    render(<Navigation activeTab="overview" onSelectTab={onSelectTab} />);

    const routingTab = screen.getByText('Routing Lab');
    fireEvent.click(routingTab);

    expect(onSelectTab).toHaveBeenCalledWith('routing');
  });
});

describe('Header component', () => {
  it('renders branding and active link count', () => {
    render(
      <Header
        backendConnected={true}
        addressFamily="ipv4"
        activeLinksCount={7}
        totalLinksCount={7}
        onRefresh={vi.fn()}
        loading={false}
      />
    );

    expect(screen.getByText('DUALSTACKROUTE')).toBeDefined();
    expect(screen.getByText('Engine Online')).toBeDefined();
    expect(screen.getByText('Mode: IPV4')).toBeDefined();
    expect(screen.getByText('Links: 7/7 Up')).toBeDefined();
  });
});

describe('ConceptsPage', () => {
  it('renders RFC concepts accurately', () => {
    render(<ConceptsPage />);
    expect(screen.getByText(/Dual-Stack Architecture/i)).toBeDefined();
  });
});
