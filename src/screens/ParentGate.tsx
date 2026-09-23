import { MathGate } from '../components/MathGate';
import { TopBar } from '../components/TopBar';
import type { Go } from '../nav';

export function ParentGate({ go }: { go: Go }) {
  return (
    <div className="screen gate">
      <TopBar onBack={() => go({ name: 'home' })} title="Voor ouders" />
      <MathGate onPass={() => go({ name: 'parent' })} />
    </div>
  );
}
