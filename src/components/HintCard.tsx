import { hintFor } from '../logic/hints';
import { Groups } from './Groups';

/** Strategie-uitleg voor a × b, met groepjes erbij. */
export function HintCard({ a, b }: { a: number; b: number }) {
  const h = hintFor(a, b);
  return (
    <div className="hint">
      <div className="hint-title">💡 {h.title}</div>
      <div className="hint-tip">{h.tip}</div>
      <ul className="hint-steps">
        {h.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <Groups a={a} b={b} small />
    </div>
  );
}
