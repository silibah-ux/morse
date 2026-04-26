import { useState, useEffect, useCallback, useRef } from 'react';
import { getPath } from './morseData';
import { useAudio } from './useAudio';
import MorseTree from './MorseTree';

const DASH_THRESHOLD = 150;

function InputButton({ onDot, onDash }) {
  const [progress, setProgress] = useState(0);
  const [active, setActive]     = useState(false);
  const startRef   = useRef(null);
  const timerRef   = useRef(null);
  const crossedRef = useRef(false);

  const handleDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = Date.now();
    crossedRef.current = false;
    setActive(true);
    setProgress(0);
    timerRef.current = setInterval(() => {
      const p = Math.min((Date.now() - startRef.current) / DASH_THRESHOLD, 1);
      if (p >= 1 && !crossedRef.current) {
        crossedRef.current = true;
        navigator.vibrate?.(18);
      }
      setProgress(p);
    }, 16);
  };

  const handleUp = useCallback(() => {
    if (!startRef.current) return;
    clearInterval(timerRef.current);
    const duration = Date.now() - startRef.current;
    startRef.current = null;
    setActive(false);
    setProgress(0);
    if (duration < DASH_THRESHOLD) onDot();
    else onDash();
  }, [onDot, onDash]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const isDash = active && progress >= 1;
  const R = 54;
  const circ = 2 * Math.PI * R;

  return (
    <button
      className={`input-btn ${active ? 'btn-pressing' : ''} ${isDash ? 'btn-dash-mode' : ''}`}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      aria-label="짧게 탭 = 도트, 길게 누름 = 대시"
    >
      <svg viewBox="0 0 132 132" className="progress-ring" aria-hidden="true">
        <circle cx="66" cy="66" r={R} className="ring-track" />
        <circle cx="66" cy="66" r={R} className="ring-fill"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - progress)}
          style={{ stroke: isDash ? 'var(--amber)' : 'var(--blue)' }} />
      </svg>
      <div className="btn-inner">
        <div className="btn-glyph">{active ? (isDash ? '—' : '·') : '●'}</div>
        <div className="btn-sublabel">{active ? (isDash ? 'DASH' : 'DOT') : 'tap · hold —'}</div>
      </div>
    </button>
  );
}

export default function App() {
  const [code, setCode]       = useState('');
  const [message, setMessage] = useState('');
  const { playDot, playDash } = useAudio();
  const autoTimer = useRef(null);

  const { node, path } = getPath(code);

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
    if (n !== null) { playDot(); setCode(next); scheduleAutoSubmit(next, n); }
  }, [code, playDot, scheduleAutoSubmit]);

  const addDash = useCallback(() => {
    clearTimeout(autoTimer.current);
    const next = code + '-';
    const { node: n } = getPath(next);
    if (n !== null) { playDash(); setCode(next); scheduleAutoSubmit(next, n); }
  }, [code, playDash, scheduleAutoSubmit]);

  const deleteLast = useCallback(() => {
    clearTimeout(autoTimer.current);
    setCode(c => c.slice(0, -1));
  }, []);

  const clearAll = useCallback(() => {
    clearTimeout(autoTimer.current);
    setCode(''); setMessage('');
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === '.')            addDot();
      else if (e.key === '-')       addDash();
      else if (e.key === ' ')       { e.preventDefault(); if (node?.letter) { setMessage(m => m + node.letter); setCode(''); } }
      else if (e.key === 'Backspace') deleteLast();
      else if (e.key === 'Enter')   clearAll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addDot, addDash, node, deleteLast, clearAll]);

  useEffect(() => () => clearTimeout(autoTimer.current), []);

  return (
    <div className="app">

      <header>
        <h1>· — MORSE CODE — ·</h1>
      </header>

      <div className="tree-wrap">
        <MorseTree currentPath={path} currentNode={node} />
      </div>

      <div className="message-row">
        <span className="msg-label">MSG</span>
        <span className="msg-text">
          {message || <span className="msg-empty">…</span>}
        </span>
        <div className="msg-actions">
          <button className="msg-btn" onClick={deleteLast} disabled={!code}>⌫</button>
          <button className="msg-btn msg-btn-red" onClick={clearAll}>✕</button>
        </div>
      </div>

      <div className="button-wrap">
        <InputButton onDot={addDot} onDash={addDash} />
        <p className="btn-hint">짧게 탭 = · &nbsp;|&nbsp; 길게 누름 = —</p>
      </div>

    </div>
  );
}
