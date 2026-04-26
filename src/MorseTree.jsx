import { useMemo } from 'react';
import { MORSE_TREE } from './morseData';

// Portrait layout: levels go left → right, slots stack vertically.
const W = 720;
const H = 1100;
const PAD_LEFT = 44;
const PAD_VERT = 40;
const LEVEL_W = 138;
const BASE_R = 26;

function buildLayout() {
  const nodes = [];
  const edges = [];
  const usableH = H - PAD_VERT * 2;

  function traverse(node, level, pos, edgeType = 'root') {
    if (!node) return;
    const slots = Math.pow(2, level);
    const x = PAD_LEFT + level * LEVEL_W;
    const y = PAD_VERT + (pos + 0.5) * (usableH / slots);
    nodes.push({ node, x, y, level, edgeType });

    const childSlotH = usableH / (slots * 2);
    if (node.dot) {
      const cy = PAD_VERT + (pos * 2 + 0.5) * childSlotH;
      const cx = PAD_LEFT + (level + 1) * LEVEL_W;
      edges.push({ from: node, to: node.dot, x1: x, y1: y, x2: cx, y2: cy, type: 'dot' });
      traverse(node.dot, level + 1, pos * 2, 'dot');
    }
    if (node.dash) {
      const cy = PAD_VERT + (pos * 2 + 1 + 0.5) * childSlotH;
      const cx = PAD_LEFT + (level + 1) * LEVEL_W;
      edges.push({ from: node, to: node.dash, x1: x, y1: y, x2: cx, y2: cy, type: 'dash' });
      traverse(node.dash, level + 1, pos * 2 + 1, 'dash');
    }
  }
  traverse(MORSE_TREE, 0, 0);
  return { nodes, edges };
}

export default function MorseTree({ currentPath, currentNode }) {
  const { nodes, edges } = useMemo(buildLayout, []);
  const pathSet  = new Set(currentPath);
  const dotNext  = currentNode?.dot  ?? null;
  const dashNext = currentNode?.dash ?? null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="morse-tree"
      aria-label="Morse code tree"
    >
      {/* legend — node-shape based, top of canvas */}
      <circle cx={W/2 - 90} cy={20} r={8} fill="none" stroke="#0099dd" strokeWidth={2} />
      <text x={W/2 - 74} y={25} fill="#0099dd" fontSize={14} fontFamily="monospace">= dot</text>
      <rect x={W/2 + 20} y={12} width={18} height={16} fill="none" stroke="#cc8800" strokeWidth={2} />
      <text x={W/2 + 44} y={25} fill="#cc8800" fontSize={14} fontFamily="monospace">= dash</text>

      {/* Edges — subtle horizontal connectors */}
      {edges.map((e, i) => {
        const toNextDot  = currentNode != null && e.from === currentNode && e.to === dotNext;
        const toNextDash = currentNode != null && e.from === currentNode && e.to === dashNext;
        const inPath     = pathSet.has(e.from) && pathSet.has(e.to);
        let stroke = '#243d56', width = 1, opacity = 0.5;
        if (toNextDot)       { stroke = '#0099dd'; width = 2.5; opacity = 0.95; }
        else if (toNextDash) { stroke = '#cc8800'; width = 2.5; opacity = 0.95; }
        else if (inPath)     { stroke = '#00aa55'; width = 2; opacity = 0.85; }
        return (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={stroke} strokeWidth={width} strokeOpacity={opacity}
            strokeLinecap="round" />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const isRoot     = n.edgeType === 'root';
        const isDashNode = n.edgeType === 'dash';
        const isCurr     = n.node === currentNode;
        const inPath     = pathSet.has(n.node);
        const isNextDot  = n.node === dotNext;
        const isNextDash = n.node === dashNext;

        let fill, stroke, textFill, opacity = 1;
        let scale = 1;
        let fontSize = 24;

        if (isCurr) {
          fill = '#aa0033'; stroke = '#ff3355'; textFill = '#fff';
          scale = isRoot ? 1 : 1.3; fontSize = 30;
        } else if (isNextDot) {
          fill = '#001d3a'; stroke = '#0099dd'; textFill = '#88ddff';
          scale = 1.12; fontSize = 27;
        } else if (isNextDash) {
          fill = '#221400'; stroke = '#cc8800'; textFill = '#ffcc66';
          scale = 1.12; fontSize = 27;
        } else if (inPath) {
          fill = '#002a1a'; stroke = '#00aa55'; textFill = '#55ffaa';
        } else {
          fill = '#0f2540'; stroke = '#2e5878'; textFill = '#7aaac8';
        }

        const r  = BASE_R * scale;
        const rw = BASE_R * 1.2 * scale;
        const rh = BASE_R * scale;
        const sw = isCurr ? 3 : 2;
        const PULSE = 8;

        return (
          <g key={i} opacity={opacity}>
            {isCurr && !isRoot && (
              isDashNode
                ? <rect x={n.x - rw - PULSE} y={n.y - rh - PULSE}
                    width={(rw + PULSE) * 2} height={(rh + PULSE) * 2} rx={0}
                    fill="none" stroke="#ff3355" strokeWidth={2} className="pulse-ring" />
                : <circle cx={n.x} cy={n.y} r={r + PULSE} fill="none"
                    stroke="#ff3355" strokeWidth={2} className="pulse-ring" />
            )}
            {isDashNode ? (
              <rect x={n.x - rw} y={n.y - rh} width={rw * 2} height={rh * 2} rx={0}
                fill={fill} stroke={stroke} strokeWidth={sw} />
            ) : (
              <circle cx={n.x} cy={n.y} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />
            )}
            {isNextDot  && <text x={n.x} y={n.y - rh - 6} textAnchor="middle" fill="#0099dd" fontSize={14} fontFamily="monospace">·</text>}
            {isNextDash && <text x={n.x} y={n.y - rh - 6} textAnchor="middle" fill="#cc8800" fontSize={14} fontFamily="monospace">—</text>}
            {isRoot ? (
              <text x={n.x} y={n.y + 7} textAnchor="middle"
                fill={isCurr ? '#ff8888' : '#2a5a3a'} fontSize={20} fontFamily="monospace">▷</text>
            ) : n.node.letter ? (
              <text x={n.x} y={n.y + fontSize * 0.37}
                textAnchor="middle" fill={textFill} fontSize={fontSize}
                fontWeight="bold" fontFamily="'Courier New', monospace"
                style={{ userSelect: 'none' }}>
                {n.node.letter}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
