import React from 'react';
import { BookOpen, Layers, ShieldCheck, Compass, GitBranch } from 'lucide-react';

export const ConceptsPage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={22} color="#3b82f6" />
          Network Engineering Concepts & Mathematical Foundation
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
          Theoretical principles of dual-stack transition architectures, constrained multi-objective route selection, and resilience analysis.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {/* Concept 1: Dual-Stack IPv4 / IPv6 Co-existence */}
        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#06b6d4" />
              1. Dual-Stack Architecture (RFC 4213)
            </span>
            <span className="badge badge-cyan">Transition Strategy</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            Dual-Stack is the standard transition mechanism recommended by the IETF (RFC 4213) where host operating systems and routing nodes simultaneously implement both IPv4 and IPv6 protocol stacks.
          </p>

          <div style={{ background: '#090e1c', padding: '0.85rem', borderRadius: 8, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
            <strong style={{ color: '#f8fafc' }}>Key Mechanisms:</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.35rem' }}>
              <li><strong>Concurrent FIBs:</strong> Independent Forwarding Information Bases for IPv4 (32-bit prefixes) and IPv6 (128-bit prefixes).</li>
              <li><strong>Transport Independence:</strong> Layer 4 TCP and UDP segments ride identically over either IPv4 or IPv6 network headers.</li>
              <li><strong>Happy Eyeballs (RFC 8305):</strong> Client dual-stack applications initiate dual DNS resolution (A and AAAA records) and race connection attempts, preferring IPv6 while seamlessly falling back to IPv4 if IPv6 path impairment exists.</li>
            </ul>
          </div>
        </div>

        {/* Concept 2: QoS Constrained Multi-Objective Routing */}
        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={18} color="#10b981" />
              2. QoS-Constrained Route Selection
            </span>
            <span className="badge badge-green">Graph Theory</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            Traditional IGP routing protocols (like OSPF or RIP) compute shortest paths using single-additive metrics (such as hop count or static interface cost). Real-time interactive applications require multi-dimensional Quality of Service (QoS).
          </p>

          <div style={{ background: '#090e1c', padding: '0.85rem', borderRadius: 8, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
            <strong style={{ color: '#f8fafc' }}>Educational Cost Formulation:</strong>
            <div className="font-mono" style={{ color: '#34d399', margin: '0.5rem 0', padding: '0.5rem', background: '#071217', borderRadius: 4 }}>
              Cost = 0.5 × Total_Latency (ms) + 20 × Loss_Rate (%) + 5 × Hops
            </div>
            <ul style={{ paddingLeft: '1.2rem' }}>
              <li><strong>Hard QoS Bounds:</strong> Paths exceeding maximum latency, loss, or hops are pruned as infeasible.</li>
              <li><strong>Cost Minimization:</strong> The remaining candidate path with the lowest composite score is chosen as optimal.</li>
            </ul>
          </div>
        </div>

        {/* Concept 3: Independent-Link Packet Loss Probability */}
        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="#f59e0b" />
              3. Independent Link Packet-Loss Model
            </span>
            <span className="badge badge-amber">Probability Theory</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            Assuming packet loss events on individual links in a transit path are statistically independent Bernoulli trials:
          </p>

          <div style={{ background: '#090e1c', padding: '0.85rem', borderRadius: 8, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
            <div className="font-mono" style={{ color: '#fbbf24', margin: '0.5rem 0', padding: '0.5rem', background: '#131109', borderRadius: 4 }}>
              P(Survival) = ∏ [1 − (Loss_i / 100)]
              <br />
              End_to_End_Loss (%) = [1 − P(Survival)] × 100
            </div>
            <p>
              Unlike delay (which is strictly additive: Latency_total = ∑ Latency_i), packet survival degrades multiplicatively across hops. Even low per-hop loss (e.g., 0.2%) compounds across extended routes.
            </p>
          </div>
        </div>

        {/* Concept 4: Network Resilience & Failover Mechanics */}
        <div className="panel">
          <div className="panel-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GitBranch size={18} color="#818cf8" />
              4. Fault Tolerance & Route Resilience
            </span>
            <span className="badge badge-neutral">High Availability</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            Resilient network architectures avoid single points of failure (SPOFs) by introducing topological diversity:
          </p>

          <div style={{ background: '#090e1c', padding: '0.85rem', borderRadius: 8, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
            <ul style={{ paddingLeft: '1.2rem' }}>
              <li><strong>Primary vs Alternate Transit:</strong> The network maintains primary low-latency paths (PC1-R1-R2-R4-PC2) and secondary alternate paths (PC1-R1-R3-R4-PC2).</li>
              <li><strong>Inter-Router Cross Links:</strong> The R2 ↔ R3 bridge provides localized fault bypass without needing to backpressure to the source edge.</li>
              <li><strong>Autonomous Failover:</strong> When a link status switches from "up" to "down", the engine automatically detects the outage and switches forwarding to the next best feasible candidate.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
