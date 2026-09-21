import { useEffect, useState } from 'react';
import { Elf } from '../components/Elf';
import { Icon } from '../components/Icon';
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
      <TopBar onBack={() => go({ name: 'home' })} title={`De winkel van ${save.elfName}`} stars={save.stars} />
      <div className="shop-body">
        <div className="shop-preview">
          <div className="elf-stage">
            <Elf wearing={preview} size="100%" mood={item && !owned ? 'juichen' : 'blij'} />
          </div>
          {item ? (
            <div className="shop-action">
              <h3>{item.name}</h3>
              {owned ? (
                wearing ? (
                  <button className="btn btn-white btn-big" onClick={() => dispatch({ type: 'unwear', slot: item.slot })}>
                    Uitdoen
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-big"
                    onClick={() => {
                      sound.tap();
                      dispatch({ type: 'wear', id: item.id });
                    }}
                  >
                    <Icon name="sparkle" />
                    Aandoen
                  </button>
                )
              ) : !open ? (
                <div className="locked-note">
                  <Icon name="lock" />
                  Komt in de winkel als de {ISLANDS[item.island].name.toLowerCase()} open is.
                </div>
              ) : save.stars >= item.price ? (
                <button
                  className="btn btn-primary btn-big"
                  onClick={() => {
                    sound.coin();
                    dispatch({ type: 'buy', id: item.id });
                    say('gekocht');
                  }}
                >
                  Kopen
                  <span className="price">
                    <Icon name="star" />
                    {item.price}
                  </span>
                </button>
              ) : (
                <div className="locked-note">
                  <Icon name="star" />
                  Nog {item.price - save.stars} sterren sparen. Oefenen levert sterren op!
                </div>
              )}
            </div>
          ) : (
            <p className="big center">Tik op iets om het te passen.</p>
          )}
        </div>
        <div className="shop-right">
          <div className="tabs" role="tablist">
            {SLOTS.map((s) => (
              <button
                key={s.slot}
                role="tab"
                aria-selected={slot === s.slot}
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
              const isWorn = save.wearing[i.slot] === i.id;
              return (
                <button
                  key={i.id}
                  className={`shop-item ${picked === i.id ? 'shop-item-on' : ''} ${isOpen || isOwned ? '' : 'shop-item-locked'}`}
                  onClick={() => pick(i.id)}
                >
                  <Elf wearing={{ [i.slot]: i.id }} size="100%" />
                  <span className="shop-item-name">{i.name}</span>
                  {isOwned ? (
                    <span className="price owned">
                      <Icon name="check" />
                      {isWorn ? 'Draag je' : 'Van jou'}
                    </span>
                  ) : isOpen ? (
                    <span className="price">
                      <Icon name="star" />
                      {i.price}
                    </span>
                  ) : (
                    <span className="price locked">
                      <Icon name="lock" />
                      Later
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
