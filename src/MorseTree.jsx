import { useMemo } from 'react';
import { MORSE_TREE } from './morseData';

const W = 1000;
const H = 480;
const PAD_TOP = 48;
const PAD_SIDE = 8;
const LEVELS = 4;
const LEVEL_H = (H - PAD_TOP - 28) / LEVELS;
const R = 19;

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

    const childSlots = slots * 2;
    const childSlotW = usableW / childSlots;

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
  const pathSet = new Set(currentPath);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="morse-tree"
      aria-label="Morse code tree diagram"
    >
      {/* Legend */}
      <text x={W / 2 - 120} y={22} textAnchor="middle" fill="#2a9d5c" fontSize={13} fontFamily="monospace">
        · · · = dot
      </text>
      <text x={W / 2 + 120} y={22} textAnchor="middle" fill="#5a7a9a" fontSize={13} fontFamily="monospace">
        ——— = dash
      </text>

      {/* Edges */}
      {edges.map((e, i) => {
        const active = pathSet.has(e.from) && pathSet.has(e.to);
        return (
          <line
            key={i}
            x1={e.x1} y1={e.y1}
            x2={e.x2} y2={e.y2}
            stroke={active ? '#00ff88' : '#1a2e42'}
            strokeWidth={active ? 3 : 1.5}
            strokeDasharray={e.type === 'dot' ? '6,5' : undefined}
            strokeLinecap="round"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const inPath = pathSet.has(n.node);
        const isCurr = n.node === currentNode;
        const isRoot = n.level === 0;
        const r = isRoot ? R * 0.6 : n.level === 4 ? R * 0.82 : R;

        let fill = '#0d1e30';
        let stroke = '#1a3a5a';
        let textFill = '#4a7a9a';
        if (isCurr) {
          fill = '#cc2244';
          stroke = '#ff4466';
          textFill = '#fff';
        } else if (inPath) {
          fill = '#006633';
          stroke = '#00cc66';
          textFill = '#fff';
        }

        const fontSize = n.level === 4 ? 11 : n.level === 3 ? 13 : 15;

        return (
          <g key={i}>
            {isCurr && (
              <circle
                cx={n.x} cy={n.y}
                r={r + 6}
                fill="none"
                stroke="#ff4466"
                strokeWidth={1.5}
                opacity={0.4}
              />
            )}
            <circle
              cx={n.x} cy={n.y}
              r={r}
              fill={fill}
              stroke={stroke}
              strokeWidth={isCurr ? 2.5 : 1.5}
            />
            {isRoot ? (
              <text
                x={n.x} y={n.y + 5}
                textAnchor="middle"
                fill="#2a6a4a"
                fontSize={14}
                fontFamily="monospace"
              >
                ▽
              </text>
            ) : n.node.letter ? (
              <text
                x={n.x} y={n.y + (fontSize * 0.37)}
                textAnchor="middle"
                fill={textFill}
                fontSize={fontSize}
                fontWeight="bold"
                fontFamily="'Courier New', monospace"
                style={{ userSelect: 'none' }}
              >
                {n.node.letter}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
