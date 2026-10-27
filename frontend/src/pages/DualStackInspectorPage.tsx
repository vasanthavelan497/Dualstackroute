import React, { useState } from 'react';
import { NetworkTopology, IPValidationResponse } from '../types/network';
import { api } from '../services/api';
import {
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Network,
  Cpu,
  Monitor,
} from 'lucide-react';

interface DualStackInspectorPageProps {
  topology: NetworkTopology;
  addressFamily: 'ipv4' | 'ipv6';
  onSwitchFamily: (fam: 'ipv4' | 'ipv6') => void;
}

export const DualStackInspectorPage: React.FC<DualStackInspectorPageProps> = ({
  topology,
  addressFamily,
  onSwitchFamily,
}) => {
  const [testAddress, setTestAddress] = useState<string>('2001:db8:10::2/64');
  const [expectedVersion, setExpectedVersion] = useState<number | undefined>(undefined);
  const [validationResult, setValidationResult] = useState<IPValidationResponse | null>(null);
  const [validating, setValidating] = useState<boolean>(false);

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testAddress.trim()) return;

    setValidating(true);
    try {
      const res = await api.validateIP(testAddress.trim(), expectedVersion);
      setValidationResult(res);
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={22} color="#06b6d4" />
            Dual-Stack IPv4 & IPv6 Inspection Suite
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Examine device interface dual-stack bindings, test CIDR addresses with standard RFC specifications, and review protocol co-existence mechanics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active Family:</span>
          <button
            className={`btn ${addressFamily === 'ipv4' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => onSwitchFamily('ipv4')}
          >
            IPv4 Active
          </button>
          <button
            className={`btn ${addressFamily === 'ipv6' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => onSwitchFamily('ipv6')}
          >
            IPv6 Active
          </button>
        </div>
      </div>

      {/* IP / Prefix Validator Console */}
      <div className="panel" style={{ marginBottom: '1.5rem', background: '#0e172a' }}>
        <div className="panel-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}>
            <Search size={18} />
            Live IP & Prefix Validation Utility (RFC 5737 & RFC 3849 Compliant)
          </span>
          <span className="badge badge-cyan">Powered by Python ipaddress</span>
        </div>

        <form onSubmit={handleValidate} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input
            type="text"
            className="text-input"
            style={{ flex: 1, minWidth: 260 }}
            value={testAddress}
            onChange={(e) => setTestAddress(e.target.value)}
            placeholder="Enter IPv4 or IPv6 host address or CIDR (e.g. 192.168.10.1/24 or 2001:db8:1::1/64)"
          />

          <select
            className="select-input"
            style={{ width: 170 }}
            value={expectedVersion || ''}
            onChange={(e) => setExpectedVersion(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          >
            <option value="">Any Version</option>
            <option value="4">Enforce IPv4</option>
            <option value="6">Enforce IPv6</option>
          </select>

          <button type="submit" className="btn btn-primary" disabled={validating}>
            <Search size={15} />
            <span>{validating ? 'Validating...' : 'Validate Address'}</span>
          </button>
        </form>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.75rem' }}>
          <span style={{ color: '#64748b' }}>Test Presets:</span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
            onClick={() => { setTestAddress('192.168.10.2/24'); setExpectedVersion(4); }}
          >
            PC1 IPv4 (192.168.10.2/24)
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
            onClick={() => { setTestAddress('2001:db8:10::2/64'); setExpectedVersion(6); }}
          >
            PC1 IPv6 (2001:db8:10::2/64)
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
            onClick={() => { setTestAddress('10.0.12.0/30'); setExpectedVersion(4); }}
          >
            R1-R2 P2P IPv4 (/30)
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
            onClick={() => { setTestAddress('256.100.1.1'); setExpectedVersion(4); }}
          >
            Invalid IPv4 Test
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
            onClick={() => { setTestAddress('2001:db8:::1'); setExpectedVersion(6); }}
          >
            Invalid IPv6 Test
          </button>
        </div>

        {/* Validation Output */}
        {validationResult && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              borderRadius: 8,
              background: validationResult.is_valid ? '#0a1d1b' : '#221115',
              border: validationResult.is_valid ? '1px solid #10b981' : '1px solid #ef4444',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {validationResult.is_valid ? (
                <>
                  <CheckCircle2 size={18} color="#34d399" />
                  <span style={{ fontWeight: 700, color: '#34d399' }}>
                    Valid IPv{validationResult.version} {validationResult.is_network_prefix ? 'Network Prefix' : 'Interface Address'}
                  </span>
                </>
              ) : (
                <>
                  <XCircle size={18} color="#f87171" />
                  <span style={{ fontWeight: 700, color: '#f87171' }}>Address Validation Failed</span>
                </>
              )}
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
              {validationResult.error_message || validationResult.details}
            </p>

            {validationResult.is_valid && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.78rem' }}>
                <div style={{ background: '#090e1c', padding: '0.5rem', borderRadius: 4 }}>
                  <span style={{ color: '#64748b' }}>Canonical IP:</span>{' '}
                  <span className="font-mono">{validationResult.ip_address}</span>
                </div>
                <div style={{ background: '#090e1c', padding: '0.5rem', borderRadius: 4 }}>
                  <span style={{ color: '#64748b' }}>Prefix Length:</span>{' '}
                  <span className="font-mono">/{validationResult.prefix_length}</span>
                </div>
                <div style={{ background: '#090e1c', padding: '0.5rem', borderRadius: 4 }}>
                  <span style={{ color: '#64748b' }}>Netmask:</span>{' '}
                  <span className="font-mono">{validationResult.netmask}</span>
                </div>
                <div style={{ background: '#090e1c', padding: '0.5rem', borderRadius: 4 }}>
                  <span style={{ color: '#64748b' }}>Network Block:</span>{' '}
                  <span className="font-mono">{validationResult.network_address}</span>
                </div>
                <div style={{ background: '#090e1c', padding: '0.5rem', borderRadius: 4 }}>
                  <span style={{ color: '#64748b' }}>Usable Hosts:</span>{' '}
                  <span className="font-mono">{validationResult.total_hosts}</span>
                </div>
                <div style={{ background: '#090e1c', padding: '0.5rem', borderRadius: 4 }}>
                  <span style={{ color: '#64748b' }}>Address Scope:</span>{' '}
                  <span>{validationResult.is_private ? 'Private / RFC 1918 / Documentation' : 'Global Unicast'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Network Interface Dual-Stack Map */}
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Network size={18} color="#60a5fa" />
            Device Dual-Stack Interface Bindings
          </span>
          <span className="badge badge-neutral">Authoritative Backend Data</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
          {topology.devices.map((dev) => (
            <div key={dev.id} style={{ background: '#090e1c', padding: '1rem', borderRadius: 8, border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {dev.type === 'router' ? <Cpu size={16} color="#60a5fa" /> : <Monitor size={16} color="#38bdf8" />}
                  <strong style={{ color: '#f8fafc' }}>{dev.name} ({dev.id})</strong>
                </div>
                <span className="badge badge-blue">{dev.type.toUpperCase()}</span>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                {dev.description}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dev.interfaces.map((iface) => (
                  <div key={iface.name} style={{ background: '#111827', padding: '0.5rem 0.75rem', borderRadius: 4, fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', fontWeight: 600, marginBottom: '0.2rem' }}>
                      <span>Port: {iface.name}</span>
                      <span>Link: {iface.connected_link_id || 'Direct'}</span>
                    </div>
                    <div className="font-mono" style={{ color: '#cbd5e1' }}>IPv4: {iface.ipv4_address}</div>
                    <div className="font-mono" style={{ color: '#818cf8' }}>IPv6: {iface.ipv6_address}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Architecture Comparison Reference */}
      <div className="panel">
        <div className="panel-title">
          <span>IPv4 vs IPv6 Architectural Comparison & Dual-Stack Co-existence</span>
          <span className="badge badge-neutral">RFC 4213 Reference</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', fontSize: '0.82rem' }}>
          <div style={{ background: '#090e1c', padding: '1rem', borderRadius: 8 }}>
            <h4 style={{ color: '#38bdf8', marginBottom: '0.5rem' }}>IPv4 Header Characteristics</h4>
            <ul style={{ paddingLeft: '1.2rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <li>32-bit (4-byte) addresses (~4.29 billion address space).</li>
              <li>Variable header size: 20 to 60 bytes (includes Options).</li>
              <li>Hop-by-hop header checksum verified at every router.</li>
              <li>Fragmented by intermediate routers when packet exceeds MTU.</li>
              <li>Broadcast address concept (e.g. 255.255.255.255, subnet broadcast).</li>
            </ul>
          </div>

          <div style={{ background: '#090e1c', padding: '1rem', borderRadius: 8 }}>
            <h4 style={{ color: '#818cf8', marginBottom: '0.5rem' }}>IPv6 Header Characteristics</h4>
            <ul style={{ paddingLeft: '1.2rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <li>128-bit (16-byte) addresses (3.4 × 10³⁸ address space).</li>
              <li>Fixed 40-byte base header for rapid hardware processing.</li>
              <li>Header checksum removed; error detection delegated to L2/L4.</li>
              <li>Fragmentation performed strictly at the sending source via PMTUD.</li>
              <li>Elimination of broadcast; all multicast and anycast addressing.</li>
            </ul>
          </div>

          <div style={{ background: '#090e1c', padding: '1rem', borderRadius: 8 }}>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Dual-Stack Deployment (RFC 4213)</h4>
            <ul style={{ paddingLeft: '1.2rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <li>Every router and host runs IPv4 and IPv6 protocol stacks concurrently.</li>
              <li>Independent routing tables (IPv4 FIB and IPv6 FIB maintained separately).</li>
              <li>Path MTU Discovery (PMTUD) and ICMPv6 Neighbor Discovery (NDP).</li>
              <li>DNS Happy Eyeballs (RFC 8305) attempts IPv6 first, falling back to IPv4.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
