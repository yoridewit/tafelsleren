import { useEffect, useRef } from 'react';
import { sound } from '../audio';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

export function NumPad({ value, onChange, onSubmit, disabled = false, maxLength = 3 }: Props) {
  // Ref zodat snel achter elkaar getypte cijfers niet met een oude waarde werken.
  const current = useRef(value);
  current.current = value;

  const press = (k: string) => {
    if (disabled) return;
    const v = current.current;
    let next = v;
    if (k === 'ok') {
      if (v !== '') onSubmit(v);
      return;
    }
    sound.tap();
    if (k === 'del') next = v.slice(0, -1);
    else if (v.length < maxLength) next = v === '0' ? k : v + k;
    current.current = next;
    onChange(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') press('ok');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
  return (
    <div className="numpad">
      {keys.map((k) => (
        <button
          key={k}
          className={`key ${k === 'ok' ? 'key-ok' : k === 'del' ? 'key-del' : ''}`}
          onClick={() => press(k)}
          disabled={disabled || (k === 'ok' && value === '')}
          aria-label={k === 'del' ? 'wissen' : k === 'ok' ? 'klaar' : k}
        >
          {k === 'del' ? '⌫' : k === 'ok' ? '✓' : k}
        </button>
      ))}
    </div>
  );
}
