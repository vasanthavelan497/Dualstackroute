import React, { useState } from 'react';
import { X, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link, LinkUpdate } from '../types/network';

interface LinkDetailModalProps {
  link: Link;
  onClose: () => void;
  onUpdate: (linkId: string, update: LinkUpdate) => Promise<void>;
  onFail: (linkId: string) => Promise<void>;
  onRestore: (linkId: string) => Promise<void>;
}

export const LinkDetailModal: React.FC<LinkDetailModalProps> = ({
  link,
  onClose,
  onUpdate,
  onFail,
  onRestore,
}) => {
  const [latency, setLatency] = useState<number>(link.latency);
  const [packetLoss, setPacketLoss] = useState<number>(link.packet_loss);
  const [bandwidth, setBandwidth] = useState<number>(link.bandwidth);
  const [cost, setCost] = useState<number>(link.cost);
  const [saving, setSaving] = useState<boolean>(false);

  const isUp = link.status === 'up';

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(link.id, {
        latency,
        packet_loss: packetLoss,
        bandwidth,
        cost,
      });
      onClose();
    } catch (err: any) {
      alert(`Error updating link: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setSaving(true);
    try {
      if (isUp) {
        await onFail(link.id);
      } else {
        await onRestore(link.id);
      }
      onClose();
    } catch (err: any) {
      alert(`Error toggling link status: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Link Metric Inspector</h2>
              <span className={`badge ${isUp ? 'badge-green' : 'badge-red'}`}>
                {isUp ? 'OPERATIONAL' : 'FAILED / DOWN'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{link.name} ({link.id})</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Link Interconnection Summary */}
        <div style={{ background: '#090e1c', padding: '0.85rem', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ color: '#64748b' }}>Connected Nodes:</span>
            <span style={{ fontWeight: 600 }}>{link.source} ({link.source_interface}) ↔ {link.target} ({link.target_interface})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ color: '#64748b' }}>IPv4 Subnet:</span>
            <span className="font-mono" style={{ color: '#38bdf8' }}>{link.ipv4_subnet}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#64748b' }}>IPv6 Prefix:</span>
            <span className="font-mono" style={{ color: '#818cf8' }}>{link.ipv6_subnet}</span>
          </div>
        </div>

        {/* Metric Form Controls */}
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label className="input-label">Latency (ms)</label>
            <span className="font-mono" style={{ fontSize: '0.85rem', color: '#60a5fa' }}>{latency} ms</span>
          </div>
          <input
            type="range"
            min="1"
            max="200"
            step="1"
            value={latency}
            onChange={(e) => setLatency(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#3b82f6' }}
          />
        </div>

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label className="input-label">Packet Loss (%)</label>
            <span className="font-mono" style={{ fontSize: '0.85rem', color: '#f59e0b' }}>{packetLoss}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="0.05"
            value={packetLoss}
            onChange={(e) => setPacketLoss(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#f59e0b' }}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Bandwidth Capacity (Mbps)</label>
          <select
            className="select-input"
            value={bandwidth}
            onChange={(e) => setBandwidth(parseFloat(e.target.value))}
          >
            <option value="100">100 Mbps (FastEthernet)</option>
            <option value="500">500 Mbps (Transit Core)</option>
            <option value="1000">1000 Mbps (Gigabit Backbone)</option>
            <option value="10000">10000 Mbps (10G Core)</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Administrative Cost / Metric Weight</label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            className="text-input"
            value={cost}
            onChange={(e) => setCost(parseFloat(e.target.value))}
          />
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            className={`btn ${isUp ? 'btn-danger' : 'btn-success'}`}
            style={{ flex: 1 }}
            onClick={handleToggleStatus}
            disabled={saving}
          >
            {isUp ? (
              <>
                <ShieldAlert size={16} />
                <span>Simulate Fail Link</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Restore Link</span>
              </>
            )}
          </button>

          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleSave}
            disabled={saving}
          >
            <Zap size={16} />
            <span>Apply Metrics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
