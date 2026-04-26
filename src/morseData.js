// International Morse Code binary tree
// left branch = dot (.), right branch = dash (-)
export const MORSE_TREE = {
  letter: null,
  dot: {
    letter: 'E',
    dot: {
      letter: 'I',
      dot: {
        letter: 'S',
        dot: { letter: 'H', dot: null, dash: null },
        dash: { letter: 'V', dot: null, dash: null },
      },
      dash: {
        letter: 'U',
        dot: { letter: 'F', dot: null, dash: null },
        dash: null,
      },
    },
    dash: {
      letter: 'A',
      dot: {
        letter: 'R',
        dot: { letter: 'L', dot: null, dash: null },
        dash: null,
      },
      dash: {
        letter: 'W',
        dot: { letter: 'P', dot: null, dash: null },
        dash: { letter: 'J', dot: null, dash: null },
      },
    },
  },
  dash: {
    letter: 'T',
    dot: {
      letter: 'N',
      dot: {
        letter: 'D',
        dot: { letter: 'B', dot: null, dash: null },
        dash: { letter: 'X', dot: null, dash: null },
      },
      dash: {
        letter: 'K',
        dot: { letter: 'C', dot: null, dash: null },
        dash: { letter: 'Y', dot: null, dash: null },
      },
    },
    dash: {
      letter: 'M',
      dot: {
        letter: 'G',
        dot: { letter: 'Z', dot: null, dash: null },
        dash: { letter: 'Q', dot: null, dash: null },
      },
      dash: {
        letter: 'O',
        dot: null,
        dash: null,
      },
    },
  },
};

export function getPath(code) {
  let node = MORSE_TREE;
  const path = [node];
  for (const ch of code) {
    node = ch === '.' ? node?.dot : node?.dash;
    if (!node) return { node: null, path: [] };
    path.push(node);
  }
  return { node, path };
}
