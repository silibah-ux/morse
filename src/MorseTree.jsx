import { useMemo } from 'react';
import { MORSE_TREE } from './morseData';

// Narrower viewBox → tree scales up more on portrait mobile
const W = 600;
const H = 660;
const PAD_TOP = 40;
const PAD_SIDE = 4;
const LEVELS = 4;
const LEVEL_H = (H - PAD_TOP - 20) / LEVELS;

// Node radius per level
const BASE_R = [10, 20, 19, 17, 13];

function buildLayout() {
  const nodes = [];
  const edges = [];
  const usableW = W - PAD_SIDE * 2;

  function traverse(node, level, pos) {
    if (!node) return;
    const slots = Math.pow(2, level);
    const x = PAD_SIDE + (pos + 0.5) * (usableW / slots);
    const y = PAD_TOP + level * LEVEL_H;
    nodes.push({ node, x, y, level });

    const childSlotW = usableW / (slots * 2);
    if (node.dot) {
      const cx = PAD_SIDE + (pos * 2 + 0.5) * childSlotW;
      const cy = PAD_TOP + (level + 1) * LEVEL_H;
      edges.push({ from: node, to: node.dot, x1: x, y1: y, x2: cx, y2: cy, type: 'dot' });
      traverse(node.dot, level + 1, pos * 2);
    }
    if (node.dash) {
      const cx = PAD_SIDE + (pos * 2 + 1 + 0.5) * childSlotW;
      const cy = PAD_TOP + (level + 1) * LEVEL_H;
      edges.push({ from: node, to: node.dash, x1: x, y1: y, x2: cx, y2: cy, type: 'dash' });
      traverse(node.dash, level + 1, pos * 2 + 1);
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
      {/* legend */}
      <text x={W/2 - 100} y={22} textAnchor="middle" fill="#0077aa" fontSize={13} fontFamily="monospace">· · · = dot</text>
      <text x={W/2 + 100} y={22} textAnchor="middle" fill="#996600" fontSize={13} fontFamily="monospace">——— = dash</text>

      {/* Edges */}
      {edges.map((e, i) => {
        const toNextDot  = currentNode != null && e.from === currentNode && e.to === dotNext;
        const toNextDash = currentNode != null && e.from === currentNode && e.to === dashNext;
        const inPath     = pathSet.has(e.from) && pathSet.has(e.to);
        let stroke = '#1e3a54', width = 1.5, opacity = 0.45;
        if (toNextDot)       { stroke = '#0099dd'; width = 3; opacity = 1; }
        else if (toNextDash) { stroke = '#cc8800'; width = 3; opacity = 1; }
        else if (inPath)     { stroke = '#00aa55'; width = 3; opacity = 1; }
        return (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={stroke} strokeWidth={width} strokeOpacity={opacity}
            strokeDasharray={e.type === 'dot' ? '5,4' : undefined}
            strokeLinecap="round" />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const isRoot     = n.level === 0;
        const isCurr     = n.node === currentNode;
        const inPath     = pathSet.has(n.node);
        const isNextDot  = n.node === dotNext;
        const isNextDash = n.node === dashNext;

        let fill, stroke, textFill, opacity = 1;
        let r = BASE_R[n.level];
        let fontSize = [0, 21, 18, 16, 13][n.level];

        if (isCurr) {
          fill = '#aa0033'; stroke = '#ff3355'; textFill = '#fff';
          r = isRoot ? r : r * 1.45; fontSize += 4;
        } else if (isNextDot) {
          fill = '#001d3a'; stroke = '#0099dd'; textFill = '#88ddff';
          r = r * 1.15; fontSize += 2;
        } else if (isNextDash) {
          fill = '#221400'; stroke = '#cc8800'; textFill = '#ffcc66';
          r = r * 1.15; fontSize += 2;
        } else if (inPath) {
          fill = '#002a1a'; stroke = '#00aa55'; textFill = '#55ffaa';
        } else {
          fill = '#0d1e30'; stroke = '#1e3a54'; textFill = '#3a6070';
          opacity = 0.65;
        }

        return (
          <g key={i} opacity={opacity}>
            {isCurr && (
              <circle cx={n.x} cy={n.y} r={r + 8} fill="none"
                stroke="#ff3355" strokeWidth={2} className="pulse-ring" />
            )}
            <circle cx={n.x} cy={n.y} r={r} fill={fill} stroke={stroke}
              strokeWidth={isCurr ? 3 : 2} />
            {isNextDot  && <text x={n.x} y={n.y - r - 5} textAnchor="middle" fill="#0099dd" fontSize={13} fontFamily="monospace">·</text>}
            {isNextDash && <text x={n.x} y={n.y - r - 5} textAnchor="middle" fill="#cc8800" fontSize={13} fontFamily="monospace">—</text>}
            {isRoot ? (
              <text x={n.x} y={n.y + 6} textAnchor="middle"
                fill={isCurr ? '#ff8888' : '#2a5a3a'} fontSize={15} fontFamily="monospace">▽</text>
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
