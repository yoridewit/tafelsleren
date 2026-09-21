import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { reducer, initialState, type Action, type AppState } from './reducer';
import { loadSave, writeSave } from '../logic/storage';
import { dayKey } from '../logic/dates';
import { onTalking, setAudioPrefs, setPreferredVoice } from '../audio';
import { duckMusic, setMusicEnabled } from '../music';

onTalking(duckMusic);

interface Store {
  state: AppState;
  dispatch: Dispatch<Action>;
  today: string;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => initialState(loadSave()));

  useEffect(() => writeSave(state.save), [state.save]);

  // Bewust tijdens het renderen (niet in een effect): de schermen eronder praten al in hun eigen effect,
  // en die draaien vóór de effecten van deze provider. Alle setters zijn idempotent.
  const settings = state.save?.settings;
  setAudioPrefs(settings?.sound ?? true, settings?.speech ?? true);
  setPreferredVoice(settings?.voice ?? null);
  setMusicEnabled(settings?.music ?? true);

  return <StoreContext.Provider value={{ state, dispatch, today: dayKey() }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore buiten StoreProvider');
  return s;
}

/** Voor schermen die alleen met een profiel bestaan. */
export function useSave() {
  const { state, dispatch, today } = useStore();
  if (!state.save) throw new Error('geen profiel');
  return { save: state.save, dispatch, today, state };
}
