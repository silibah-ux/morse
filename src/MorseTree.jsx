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
  const pathSet = new Set(currentPath);

  const dotNext = currentNode?.dot ?? null;
  const dashNext = currentNode?.dash ?? null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="morse-tree"
      aria-label="Morse code tree diagram"
    >
      {/* Legend */}
      <text x={W / 2 - 130} y={22} textAnchor="middle" fill="#0077aa" fontSize={12} fontFamily="monospace">
        · · · = dot
      </text>
      <text x={W / 2 + 130} y={22} textAnchor="middle" fill="#aa7700" fontSize={12} fontFamily="monospace">
        ——— = dash
      </text>

      {/* Edges */}
      {edges.map((e, i) => {
        const toNextDot  = currentNode != null && e.from === currentNode && e.to === dotNext;
        const toNextDash = currentNode != null && e.from === currentNode && e.to === dashNext;
        const inPath     = pathSet.has(e.from) && pathSet.has(e.to);

        let stroke = '#0c1a28';
        let width  = 1;
        let opacity = 0.3;
        let dash = e.type === 'dot' ? '6,5' : undefined;

        if (toNextDot) {
          stroke = '#0099dd'; width = 2.5; opacity = 1;
        } else if (toNextDash) {
          stroke = '#cc8800'; width = 2.5; opacity = 1;
        } else if (inPath) {
          stroke = '#00aa55'; width = 2.5; opacity = 1;
        }

        return (
          <line
            key={i}
            x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={stroke}
            strokeWidth={width}
            strokeOpacity={opacity}
            strokeDasharray={dash}
            strokeLinecap="round"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const isRoot     = n.level === 0;
        const isCurr     = n.node === currentNode;
        const inPath     = pathSet.has(n.node);
        const isNextDot  = n.node === dotNext;
        const isNextDash = n.node === dashNext;

        let fill, stroke, textFill, nodeR, opacity = 1;

        if (isCurr) {
          fill = '#aa0033'; stroke = '#ff3355'; textFill = '#fff';
          nodeR = isRoot ? R * 0.85 : R * 1.4;
        } else if (isNextDot) {
          fill = '#001d3a'; stroke = '#0099dd'; textFill = '#66ccff';
          nodeR = R * 1.05;
        } else if (isNextDash) {
          fill = '#221400'; stroke = '#cc8800'; textFill = '#ffcc55';
          nodeR = R * 1.05;
        } else if (inPath) {
          fill = '#002a1a'; stroke = '#00aa55'; textFill = '#55ffaa';
          nodeR = R * 0.9;
        } else {
          fill = '#090e18'; stroke = '#101e2c'; textFill = '#172535';
          nodeR = R * 0.72;
          opacity = 0.4;
        }

        const fontSize = n.level === 4 ? 10 : n.level === 3 ? 12 : 14;

        return (
          <g key={i} opacity={opacity}>
            {/* Pulse ring for current node */}
            {isCurr && (
              <circle
                cx={n.x} cy={n.y}
                r={nodeR + 7}
                fill="none"
                stroke="#ff3355"
                strokeWidth={1.5}
                className="pulse-ring"
              />
            )}

            <circle cx={n.x} cy={n.y} r={nodeR} fill={fill} stroke={stroke} strokeWidth={isCurr ? 2.5 : 1.5} />

            {/* Dot / dash badge above next-step nodes */}
            {isNextDot && (
              <text x={n.x} y={n.y - nodeR - 5} textAnchor="middle" fill="#0099dd" fontSize={11} fontFamily="monospace">·</text>
            )}
            {isNextDash && (
              <text x={n.x} y={n.y - nodeR - 5} textAnchor="middle" fill="#cc8800" fontSize={11} fontFamily="monospace">—</text>
            )}

            {isRoot ? (
              <text x={n.x} y={n.y + 5} textAnchor="middle" fill={isCurr ? '#ff8888' : '#2a5a3a'} fontSize={13} fontFamily="monospace">▽</text>
            ) : n.node.letter ? (
              <text
                x={n.x} y={n.y + fontSize * 0.38}
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
