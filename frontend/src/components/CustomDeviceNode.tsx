import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Monitor, Cpu } from 'lucide-react';
import { Device } from '../types/network';

export interface DeviceNodeData extends Record<string, unknown> {
  device: Device;
  isSelectedPath: boolean;
  addressFamily: 'ipv4' | 'ipv6';
  onSelect: (device: Device) => void;
}

export const CustomDeviceNode: React.FC<NodeProps> = memo(({ data }) => {
  const nodeData = data as unknown as DeviceNodeData;
  const { device, isSelectedPath, addressFamily, onSelect } = nodeData;

  const isRouter = device.type === 'router';
  const displayIp = addressFamily === 'ipv4' ? device.primary_ipv4 : device.primary_ipv6;

  return (
    <div
      className={`custom-node ${isRouter ? 'router' : 'host'} ${isSelectedPath ? 'selected-path' : ''}`}
      onClick={() => onSelect(device)}
      style={{ cursor: 'pointer' }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: isSelectedPath ? '#10b981' : '#64748b', width: 9, height: 9 }}
      />

      <div className="custom-node-header">
        {isRouter ? (
          <Cpu size={18} color={isSelectedPath ? '#34d399' : '#60a5fa'} />
        ) : (
          <Monitor size={18} color={isSelectedPath ? '#34d399' : '#38bdf8'} />
        )}
        <span style={{ color: isSelectedPath ? '#34d399' : '#f8fafc' }}>{device.id}</span>
        <span
          className={`badge ${isRouter ? 'badge-blue' : 'badge-cyan'}`}
          style={{ marginLeft: 'auto', fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
        >
          {device.type.toUpperCase()}
        </span>
      </div>

      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.2rem' }}>
        {device.name}
      </div>

      <div className="custom-node-ip">
        <span style={{ color: '#64748b' }}>{addressFamily.toUpperCase()}:</span> {displayIp}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: isSelectedPath ? '#10b981' : '#64748b', width: 9, height: 9 }}
      />
    </div>
  );
});
