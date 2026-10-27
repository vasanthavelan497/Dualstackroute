import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Device, Link, NetworkTopology, CandidatePath, LinkUpdate } from '../types/network';
import { CustomDeviceNode, DeviceNodeData } from './CustomDeviceNode';
import { LinkDetailModal } from './LinkDetailModal';
import { RotateCcw, Info } from 'lucide-react';

interface TopologyGraphProps {
  topology: NetworkTopology;
  selectedRoute: CandidatePath | null;
  addressFamily: 'ipv4' | 'ipv6';
  onUpdateLink: (linkId: string, update: LinkUpdate) => Promise<void>;
  onFailLink: (linkId: string) => Promise<void>;
  onRestoreLink: (linkId: string) => Promise<void>;
  onResetTopology: () => Promise<void>;
  onSelectDevice?: (device: Device) => void;
}

const nodeTypes = {
  deviceNode: CustomDeviceNode,
};

export const TopologyGraph: React.FC<TopologyGraphProps> = ({
  topology,
  selectedRoute,
  addressFamily,
  onUpdateLink,
  onFailLink,
  onRestoreLink,
  onResetTopology,
  onSelectDevice,
}) => {
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [inspectedDevice, setInspectedDevice] = useState<Device | null>(null);

  const selectedPathNodes = useMemo(() => {
    return new Set(selectedRoute?.path || []);
  }, [selectedRoute]);

  const selectedPathLinks = useMemo(() => {
    return new Set(selectedRoute?.link_ids || []);
  }, [selectedRoute]);

  // Generate React Flow Nodes
  const nodes: Node[] = useMemo(() => {
    return topology.devices.map((device) => {
      const isSelected = selectedPathNodes.has(device.id);
      return {
        id: device.id,
        type: 'deviceNode',
        position: { x: device.position_x, y: device.position_y },
        data: {
          device,
          isSelectedPath: isSelected,
          addressFamily,
          onSelect: (dev: Device) => {
            setInspectedDevice(dev);
            if (onSelectDevice) onSelectDevice(dev);
          },
        } as DeviceNodeData,
      };
    });
  }, [topology.devices, selectedPathNodes, addressFamily, onSelectDevice]);

  // Generate React Flow Edges
  const edges: Edge[] = useMemo(() => {
    return topology.links.map((link) => {
      const isSelected = selectedPathLinks.has(link.id);
      const isDown = link.status === 'down';

      let strokeColor = '#475569';
      let strokeWidth = 2;
      let strokeDasharray = undefined;
      let animated = false;

      if (isDown) {
        strokeColor = '#ef4444';
        strokeWidth = 3;
        strokeDasharray = '5 5';
      } else if (isSelected) {
        strokeColor = '#10b981';
        strokeWidth = 4;
        animated = true;
      }

      return {
        id: link.id,
        source: link.source,
        target: link.target,
        animated,
        label: `${link.id}: ${link.latency}ms | ${link.packet_loss}% | ${link.bandwidth}M`,
        labelStyle: {
          fill: isDown ? '#fca5a5' : isSelected ? '#a7f3d0' : '#94a3b8',
          fontWeight: 600,
          fontSize: '11px',
          fontFamily: 'JetBrains Mono',
        },
        labelBgStyle: {
          fill: '#0f172a',
          fillOpacity: 0.9,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [6, 4] as [number, number],
        style: {
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          filter: isSelected ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' : undefined,
          cursor: 'pointer',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 14,
          height: 14,
        },
      };
    });
  }, [topology.links, selectedPathLinks]);

  return (
    <div style={{ position: 'relative' }}>
      <div className="topology-canvas-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          onEdgeClick={(_, edge) => {
            const linkObj = topology.links.find((l) => l.id === edge.id);
            if (linkObj) setSelectedLink(linkObj);
          }}
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls style={{ background: '#0f172a', border: '1px solid #334155' }} />
        </ReactFlow>

        {/* Overlay Controls */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={onResetTopology}
            style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem' }}
          >
            <RotateCcw size={14} />
            <span>Reset Baseline Scenario</span>
          </button>
        </div>

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.5rem 0.85rem',
            borderRadius: 8,
            fontSize: '0.75rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 14, height: 4, background: '#10b981', borderRadius: 2 }} />
            <span>Selected Path</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 14, height: 3, background: '#475569', borderRadius: 2 }} />
            <span>Operational Link</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: 14, height: 3, borderTop: '2px dashed #ef4444' }} />
            <span>Failed / Down</span>
          </div>
          <div style={{ color: '#94a3b8', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Info size={12} />
            <span>Click any link to inspect/fail/restore</span>
          </div>
        </div>
      </div>

      {/* Inspected Device Sidebar info if opened */}
      {inspectedDevice && (
        <div className="panel" style={{ marginTop: '1rem' }}>
          <div className="panel-title">
            <span>Device Information: {inspectedDevice.name} ({inspectedDevice.id})</span>
            <button
              onClick={() => setInspectedDevice(null)}
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
            >
              Close
            </button>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
            {inspectedDevice.description}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {inspectedDevice.interfaces.map((iface) => (
              <div key={iface.name} style={{ background: '#090e1c', padding: '0.75rem', borderRadius: 6, fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '0.25rem' }}>
                  Interface: {iface.name} (Link: {iface.connected_link_id || 'N/A'})
                </div>
                <div className="font-mono" style={{ color: '#cbd5e1' }}>IPv4: {iface.ipv4_address}</div>
                <div className="font-mono" style={{ color: '#818cf8' }}>IPv6: {iface.ipv6_address}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link Inspector Modal */}
      {selectedLink && (
        <LinkDetailModal
          link={selectedLink}
          onClose={() => setSelectedLink(null)}
          onUpdate={onUpdateLink}
          onFail={onFailLink}
          onRestore={onRestoreLink}
        />
      )}
    </div>
  );
};
