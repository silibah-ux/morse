import { useMemo } from 'react';
import { MORSE_TREE } from './morseData';

const W = 1100;
const H = 580;
const PAD_TOP = 36;
const PAD_SIDE = 4;
const LEVEL_H = 130;
const BASE_R = 30;

function buildLayout() {
  const nodes = [];
  const edges = [];
  const usableW = W - PAD_SIDE * 2;

  function traverse(node, level, pos, edgeType = 'root') {
    if (!node) return;
    const slots = Math.pow(2, level);
    const x = PAD_SIDE + (pos + 0.5) * (usableW / slots);
    const y = PAD_TOP + level * LEVEL_H;
    nodes.push({ node, x, y, level, edgeType });

    const childSlotW = usableW / (slots * 2);
    if (node.dot) {
      const cx = PAD_SIDE + (pos * 2 + 0.5) * childSlotW;
      const cy = PAD_TOP + (level + 1) * LEVEL_H;
      edges.push({ from: node, to: node.dot, x1: x, y1: y, x2: cx, y2: cy, type: 'dot' });
      traverse(node.dot, level + 1, pos * 2, 'dot');
    }
    if (node.dash) {
      const cx = PAD_SIDE + (pos * 2 + 1 + 0.5) * childSlotW;
      const cy = PAD_TOP + (level + 1) * LEVEL_H;
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
      <text x={W/2 - 160} y={24} textAnchor="middle" fill="#0077aa" fontSize={18} fontFamily="monospace">· · · = dot</text>
      <text x={W/2 + 160} y={24} textAnchor="middle" fill="#996600" fontSize={18} fontFamily="monospace">——— = dash</text>

      {edges.map((e, i) => {
        const toNextDot  = currentNode != null && e.from === currentNode && e.to === dotNext;
        const toNextDash = currentNode != null && e.from === currentNode && e.to === dashNext;
        const inPath     = pathSet.has(e.from) && pathSet.has(e.to);
        let stroke = '#2e5878', width = 2, opacity = 0.7;
        if (toNextDot)       { stroke = '#0099dd'; width = 4; opacity = 1; }
        else if (toNextDash) { stroke = '#cc8800'; width = 4; opacity = 1; }
        else if (inPath)     { stroke = '#00aa55'; width = 4; opacity = 1; }
        return (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={stroke} strokeWidth={width} strokeOpacity={opacity}
            strokeDasharray={e.type === 'dot' ? '8,6' : undefined}
            strokeLinecap="round" />
        );
      })}

      {nodes.map((n, i) => {
        const isRoot     = n.edgeType === 'root';
        const isDashNode = n.edgeType === 'dash';
        const isCurr     = n.node === currentNode;
        const inPath     = pathSet.has(n.node);
        const isNextDot  = n.node === dotNext;
        const isNextDash = n.node === dashNext;

        let fill, stroke, textFill, opacity = 1;
        let scale = 1;
        let fontSize = 28;

        if (isCurr) {
          fill = '#aa0033'; stroke = '#ff3355'; textFill = '#fff';
          scale = isRoot ? 1 : 1.35; fontSize = 36;
        } else if (isNextDot) {
          fill = '#001d3a'; stroke = '#0099dd'; textFill = '#88ddff';
          scale = 1.12; fontSize = 32;
        } else if (isNextDash) {
          fill = '#221400'; stroke = '#cc8800'; textFill = '#ffcc66';
          scale = 1.12; fontSize = 32;
        } else if (inPath) {
          fill = '#002a1a'; stroke = '#00aa55'; textFill = '#55ffaa';
        } else {
          fill = '#0f2540'; stroke = '#2e5878'; textFill = '#7aaac8';
        }

        const r  = BASE_R * scale;
        const rw = BASE_R * 1.2 * scale;
        const rh = BASE_R * scale;
        const sw = isCurr ? 3 : 2;
        const PULSE = 10;

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
            {isNextDot  && <text x={n.x} y={n.y - rh - 6} textAnchor="middle" fill="#0099dd" fontSize={16} fontFamily="monospace">·</text>}
            {isNextDash && <text x={n.x} y={n.y - rh - 6} textAnchor="middle" fill="#cc8800" fontSize={16} fontFamily="monospace">—</text>}
            {isRoot ? (
              <text x={n.x} y={n.y + 8} textAnchor="middle"
                fill={isCurr ? '#ff8888' : '#2a5a3a'} fontSize={22} fontFamily="monospace">▽</text>
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
