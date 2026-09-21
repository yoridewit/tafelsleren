import { useCallback, useEffect, useState } from 'react';
import { useStore } from './state/store';
import type { Screen } from './nav';
import { Welcome } from './screens/Welcome';
import { Home } from './screens/Home';
import { IslandScreen } from './screens/IslandScreen';
import { Discover } from './screens/Discover';
import { RoundScreen } from './screens/RoundScreen';
import { RoundResult } from './screens/RoundResult';
import { Shop } from './screens/Shop';
import { Album } from './screens/Album';
import { SpeedGame } from './screens/SpeedGame';
import { ParentGate } from './screens/ParentGate';
import { Parent } from './screens/Parent';

export function App() {
  const { state } = useStore();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [visit, setVisit] = useState(0);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    setVisit((v) => v + 1); // nieuwe key: "nog een ronde" start echt opnieuw
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!state.save) setScreen({ name: 'home' });
  }, [state.save]);

  if (!state.save) return <Welcome />;

  switch (screen.name) {
    case 'home':
      return <Home key={visit} go={go} />;
    case 'island':
      return <IslandScreen key={visit} island={screen.island} go={go} />;
    case 'discover':
      return <Discover key={visit} island={screen.island} go={go} />;
    case 'round':
      return <RoundScreen key={visit} island={screen.island} go={go} />;
    case 'result':
      return <RoundResult key={visit} {...screen} go={go} />;
    case 'shop':
      return <Shop key={visit} go={go} />;
    case 'album':
      return <Album key={visit} go={go} />;
    case 'speed':
      return <SpeedGame key={visit} go={go} />;
    case 'gate':
      return <ParentGate key={visit} go={go} />;
    case 'parent':
      return <Parent key={visit} go={go} />;
  }
}
