import { useState, useEffect, useCallback, useRef } from 'react';
import { getPath } from './morseData';
import { useAudio } from './useAudio';
import MorseTree from './MorseTree';

export default function App() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState(null);
  const { playDot, playDash } = useAudio();
  const autoTimer = useRef(null);

  const { node, path } = getPath(code);
  const dotNext  = node?.dot  ?? null;
  const dashNext = node?.dash ?? null;

  const triggerFlash = (type) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 130);
  };

  const scheduleAutoSubmit = useCallback((nextCode, nextNode) => {
    clearTimeout(autoTimer.current);
    if (nextCode && nextNode?.letter) {
      autoTimer.current = setTimeout(() => {
        setMessage(m => m + nextNode.letter);
        setCode('');
      }, 1400);
    }
  }, []);

  const addDot = useCallback(() => {
    clearTimeout(autoTimer.current);
    const next = code + '.';
    const { node: n } = getPath(next);
    if (n !== null) {
      playDot();
      triggerFlash('dot');
      setCode(next);
      scheduleAutoSubmit(next, n);
    }
  }, [code, playDot, scheduleAutoSubmit]);

  const addDash = useCallback(() => {
    clearTimeout(autoTimer.current);
    const next = code + '-';
    const { node: n } = getPath(next);
    if (n !== null) {
      playDash();
      triggerFlash('dash');
      setCode(next);
      scheduleAutoSubmit(next, n);
    }
  }, [code, playDash, scheduleAutoSubmit]);

  const submit = useCallback(() => {
    clearTimeout(autoTimer.current);
    if (node?.letter) setMessage(m => m + node.letter);
    setCode('');
  }, [node]);

  const addSpace = useCallback(() => {
    clearTimeout(autoTimer.current);
    if (node?.letter) setMessage(m => m + node.letter + ' ');
    else setMessage(m => m.trimEnd() + ' ');
    setCode('');
  }, [node]);

  const deleteLast = useCallback(() => {
    clearTimeout(autoTimer.current);
    setCode(c => c.slice(0, -1));
  }, []);

  const clearAll = useCallback(() => {
    clearTimeout(autoTimer.current);
    setCode('');
    setMessage('');
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '.')           addDot();
      else if (e.key === '-')      addDash();
      else if (e.key === ' ')      { e.preventDefault(); submit(); }
      else if (e.key === 'Backspace') deleteLast();
      else if (e.key === 'Enter')  clearAll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addDot, addDash, submit, deleteLast, clearAll]);

  useEffect(() => () => clearTimeout(autoTimer.current), []);

  const codeDisplay = code.replace(/\./g, '·').replace(/-/g, '—');

  return (
    <div className="app">
      <header>
        <h1>· — MORSE CODE — ·</h1>
      </header>

      <div className="tree-wrap">
        <MorseTree currentPath={path} currentNode={node} />
      </div>

      {/* Fork panel: current position + next two choices */}
      <div className="fork-panel">
        <button
          className={`fork-cell fork-dot ${!dotNext ? 'fork-dead' : ''} ${flash === 'dot' ? 'fork-flash' : ''}`}
          onPointerDown={dotNext ? addDot : undefined}
          disabled={!dotNext}
        >
          <div className="fork-symbol dot-symbol">·</div>
          <div className="fork-arrow">↓</div>
          <div className="fork-letter">{dotNext?.letter ?? '✕'}</div>
          <div className="fork-key">DOT &nbsp;·</div>
        </button>

        <div className="fork-center">
          <div className="fork-code">{codeDisplay || <span className="fork-hint">시작</span>}</div>
          <div className="fork-current">{node?.letter ?? '▽'}</div>
          <div className="fork-actions">
            <button className="action-btn ok-btn" onClick={submit} disabled={!node?.letter}>✓</button>
            <button className="action-btn del-btn" onClick={deleteLast} disabled={!code}>⌫</button>
          </div>
        </div>

        <button
          className={`fork-cell fork-dash ${!dashNext ? 'fork-dead' : ''} ${flash === 'dash' ? 'fork-flash' : ''}`}
          onPointerDown={dashNext ? addDash : undefined}
          disabled={!dashNext}
        >
          <div className="fork-symbol dash-symbol">—</div>
          <div className="fork-arrow">↓</div>
          <div className="fork-letter">{dashNext?.letter ?? '✕'}</div>
          <div className="fork-key">DASH —</div>
        </button>
      </div>

      {/* Message + secondary controls */}
      <div className="bottom-row">
        <div className="message-box">
          <div className="box-label">메시지</div>
          <div className="message-text">
            {message || <span className="hint-text">여기에 메시지가 표시됩니다</span>}
          </div>
        </div>
        <div className="secondary-btns">
          <button className="sec-btn space-btn" onClick={addSpace}>␣</button>
          <button className="sec-btn clear-btn" onClick={clearAll}>✕</button>
        </div>
      </div>

      <footer>
        <span>. = dot</span>
        <span>- = dash</span>
        <span>Space = 확인</span>
        <span>Enter = 초기화</span>
        <span>1.4초 = 자동 확인</span>
      </footer>
    </div>
  );
}
