import { Icon } from './Icon';
import { remainingMinutes } from '../logic/timeLimit';
import { useStore } from '../state/store';

/** Kleine aftelklok met de resterende speeltijd van vandaag; niets zonder limiet. */
export function TimeChip() {
  const { state, today } = useStore();
  const minutes = state.save ? remainingMinutes(state.save, today) : null;
  if (minutes === null) return null;
  return (
    <span className="chip-stat chip-time" aria-label={`nog ${minutes} minuten speeltijd`} title="speeltijd vandaag">
      <Icon name="clock" />
      {minutes} min
    </span>
  );
}
