import { describe, it, expect } from 'vitest';
import { RARITIES, SHOP, itemById } from './shop';
import { BACKGROUNDS, HATS, NECK, PETS, WANDS, WINGS } from '../components/ElfItems';

const ASSETS: Record<string, Record<string, unknown>> = {
  hoed: HATS,
  sjaal: NECK,
  vleugels: WINGS,
  staf: WANDS,
  huisdier: PETS,
  achtergrond: BACKGROUNDS,
};

describe('shop', () => {
  it('has unique ids', () => {
    const ids = SHOP.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item has matching hand-drawn art for its slot', () => {
    for (const item of SHOP) expect(ASSETS[item.slot][item.id], `${item.id} (${item.slot})`).toBeDefined();
  });

  it('every item has a valid rarity and positive price', () => {
    const rarities = new Set(RARITIES.map((r) => r.rarity));
    for (const item of SHOP) {
      expect(rarities.has(item.rarity)).toBe(true);
      expect(item.price).toBeGreaterThan(0);
    }
  });

  it('itemById finds items by id', () => {
    expect(itemById('strik')?.slot).toBe('hoed');
    expect(itemById('does-not-exist')).toBeUndefined();
  });
});
