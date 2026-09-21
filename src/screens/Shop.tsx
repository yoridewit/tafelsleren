import { useEffect, useState } from 'react';
import { Elf } from '../components/Elf';
import { TopBar } from '../components/TopBar';
import { SHOP, SLOTS, itemById, type ItemSlot } from '../data/shop';
import { ISLANDS } from '../logic/facts';
import { useSave } from '../state/store';
import { say, sayOnce, sound } from '../audio';
import type { Go } from '../nav';

export function Shop({ go }: { go: Go }) {
  const { save, dispatch } = useSave();
  const [slot, setSlot] = useState<ItemSlot>('hoed');
  const [picked, setPicked] = useState<string | null>(null);
  const item = picked ? itemById(picked) : undefined;
  const preview = item ? { ...save.wearing, [item.slot]: item.id } : save.wearing;

  const owned = item && save.owned.includes(item.id);
  const wearing = item && save.wearing[item.slot] === item.id;
  const open = item && save.unlocked.includes(item.island);

  useEffect(() => sayOnce('winkel-welkom', 'winkel-welkom'), []);

  const pick = (id: string) => {
    setPicked(id);
    const it = itemById(id)!;
    if (save.owned.includes(id)) return;
    if (!save.unlocked.includes(it.island)) say('winkel-later');
    else if (save.stars < it.price) say('sparen');
  };

  return (
    <div className="screen shop">
      <TopBar onBack={() => go({ name: 'home' })} title={`👗 De winkel van ${save.elfName}`} stars={save.stars} />
      <div className="shop-body">
        <div className="shop-preview">
          <Elf wearing={preview} size="100%" mood={item && !owned ? 'juichen' : 'blij'} />
          {item ? (
            <div className="shop-action">
              <div className="big">{item.name}</div>
              {owned ? (
                wearing ? (
                  <button className="btn btn-white btn-big" onClick={() => dispatch({ type: 'unwear', slot: item.slot })}>
                    Uitdoen
                  </button>
                ) : (
                  <button className="btn btn-primary btn-big" onClick={() => { sound.tap(); dispatch({ type: 'wear', id: item.id }); }}>
                    Aandoen ✨
                  </button>
                )
              ) : !open ? (
                <div className="locked-note">🔒 Komt in de winkel als {ISLANDS[item.island].name.toLowerCase()} open is</div>
              ) : save.stars >= item.price ? (
                <button
                  className="btn btn-primary btn-big"
                  onClick={() => {
                    sound.coin();
                    dispatch({ type: 'buy', id: item.id });
                    say('gekocht');
                  }}
                >
                  Kopen voor {item.price} ⭐
                </button>
              ) : (
                <div className="locked-note">
                  Nog {item.price - save.stars} ⭐ sparen. Oefenen levert sterren op!
                </div>
              )}
            </div>
          ) : (
            <div className="big center">Tik op iets om het te passen!</div>
          )}
        </div>
        <div className="shop-right">
          <div className="tabs">
            {SLOTS.map((s) => (
              <button
                key={s.slot}
                className={`tab ${slot === s.slot ? 'tab-on' : ''}`}
                onClick={() => {
                  setSlot(s.slot);
                  setPicked(null);
                }}
              >
                <span className="tab-emoji">{s.emoji}</span>
                <span className="tab-label">{s.label}</span>
              </button>
            ))}
          </div>
          <div className="shop-grid">
            {SHOP.filter((i) => i.slot === slot).map((i) => {
              const isOwned = save.owned.includes(i.id);
              const isOpen = save.unlocked.includes(i.island);
              return (
                <button
                  key={i.id}
                  className={`shop-item ${picked === i.id ? 'shop-item-on' : ''} ${isOpen ? '' : 'shop-item-locked'}`}
                  onClick={() => pick(i.id)}
                >
                  <Elf wearing={{ [i.slot]: i.id }} size="100%" />
                  <span className="shop-item-name">{i.name}</span>
                  <span className="shop-item-price">
                    {isOwned ? (save.wearing[i.slot] === i.id ? '✨ aan' : '✓ van jou') : isOpen ? `${i.price} ⭐` : '🔒'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
