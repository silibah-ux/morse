import { useState, useEffect, useCallback, useRef } from 'react';
import { getPath } from './morseData';
import { useAudio } from './useAudio';
import MorseTree from './MorseTree';

export default function App() {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState(null); // 'dot' | 'dash' | null
  const { playDot, playDash } = useAudio();
  const autoTimer = useRef(null);

  const { node, path } = getPath(code);

  const triggerFlash = (type) => {
    setFlash(type);
    setTimeout(() => setFlash(null), 150);
  };

  const scheduleAutoSubmit = useCallback((currentCode, currentNode) => {
    clearTimeout(autoTimer.current);
    if (currentCode && currentNode?.letter) {
      autoTimer.current = setTimeout(() => {
        setMessage(m => m + currentNode.letter);
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
      if (e.key === '.') addDot();
      else if (e.key === '-') addDash();
      else if (e.key === ' ') { e.preventDefault(); submit(); }
      else if (e.key === 'Backspace') deleteLast();
      else if (e.key === 'Enter') clearAll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addDot, addDash, submit, deleteLast, clearAll]);

  useEffect(() => () => clearTimeout(autoTimer.current), []);

  const codeDisplay = code
    ? code.replace(/\./g, '·').replace(/-/g, '—')
    : '';

  return (
    <div className="app">
      <header>
        <h1>· — MORSE CODE — ·</h1>
      </header>

      <div className="tree-wrap">
        <MorseTree currentPath={path} currentNode={node} />
      </div>

      <div className="status-row">
        <div className="code-box">
          <div className="box-label">입력 중</div>
          <div className="code-symbols">
            {codeDisplay || <span className="hint-text">· 또는 — 를 누르세요</span>}
          </div>
        </div>
        <div className={`letter-box ${node?.letter ? 'has-letter' : ''}`}>
          <div className="box-label">현재 글자</div>
          <div className="current-letter">
            {node?.letter ?? (code ? '?' : '·')}
          </div>
        </div>
      </div>

      <div className="controls">
        <button
          className={`btn-input dot-btn ${flash === 'dot' ? 'active' : ''}`}
          onPointerDown={addDot}
        >
          <div className="input-symbol">·</div>
          <div className="input-label">DOT</div>
          <div className="input-key">키: .</div>
        </button>

        <button
          className={`btn-input dash-btn ${flash === 'dash' ? 'active' : ''}`}
          onPointerDown={addDash}
        >
          <div className="input-symbol">—</div>
          <div className="input-label">DASH</div>
          <div className="input-key">키: -</div>
        </button>

        <div className="side-btns">
          <button className="side-btn ok-btn" onClick={submit} disabled={!node?.letter}>
            ✓ 확인
          </button>
          <button className="side-btn space-btn" onClick={addSpace}>
            ␣ 띄어쓰기
          </button>
          <button className="side-btn del-btn" onClick={deleteLast} disabled={!code}>
            ⌫ 삭제
          </button>
          <button className="side-btn clear-btn" onClick={clearAll}>
            ✕ 초기화
          </button>
        </div>
      </div>

      <div className="message-box">
        <div className="box-label">메시지</div>
        <div className="message-text">
          {message || <span className="hint-text">여기에 메시지가 표시됩니다</span>}
        </div>
      </div>

      <footer>
        <span>· = DOT</span>
        <span>— = DASH</span>
        <span>Space = 확인</span>
        <span>Enter = 초기화</span>
        <span>1.4초 무입력 시 자동 확인</span>
      </footer>
    </div>
  );
}
