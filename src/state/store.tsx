import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { reducer, initialState, type Action, type AppState } from './reducer';
import { loadSave, writeSave } from '../logic/storage';
import { dayKey } from '../logic/dates';
import { setAudioPrefs, setPreferredVoice } from '../audio';

interface Store {
  state: AppState;
  dispatch: Dispatch<Action>;
  today: string;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => initialState(loadSave()));

  useEffect(() => writeSave(state.save), [state.save]);
  useEffect(() => {
    if (!state.save) return;
    setAudioPrefs(state.save.settings.sound, state.save.settings.speech);
    setPreferredVoice(state.save.settings.voice);
  }, [state.save?.settings]);

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
