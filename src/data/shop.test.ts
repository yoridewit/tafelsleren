import { describe, it, expect } from 'vitest';
import { RARITIES, SHOP, isUnlocked, itemById } from './shop';
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

  it('has plenty of items, spread over every slot', () => {
    expect(SHOP.length).toBeGreaterThanOrEqual(54);
    for (const slot of Object.keys(ASSETS)) expect(SHOP.filter((i) => i.slot === slot).length).toBeGreaterThanOrEqual(6);
  });

  it('every item needs between 0 and 55 known sums', () => {
    for (const item of SHOP) {
      expect(Number.isInteger(item.needs), item.id).toBe(true);
      expect(item.needs, item.id).toBeGreaterThanOrEqual(0);
      expect(item.needs, item.id).toBeLessThanOrEqual(55);
    }
  });

  it('price only goes up with rarity: no rarity is cheaper than the most expensive of the one below', () => {
    const order = RARITIES.map((r) => r.rarity);
    for (let i = 1; i < order.length; i++) {
      const below = SHOP.filter((x) => x.rarity === order[i - 1]).map((x) => x.price);
      const here = SHOP.filter((x) => x.rarity === order[i]).map((x) => x.price);
      expect(Math.min(...here), order[i]).toBeGreaterThan(Math.max(...below));
    }
  });

  it('there is something cheap to buy right from the start, in several slots', () => {
    const start = SHOP.filter((i) => i.needs === 0 && i.price <= 30);
    expect(start.length).toBeGreaterThanOrEqual(6);
    expect(new Set(start.map((i) => i.slot)).size).toBeGreaterThanOrEqual(4);
  });

  it('every slot has a dream item to save up for', () => {
    for (const slot of Object.keys(ASSETS)) {
      const dream = SHOP.filter((i) => i.slot === slot && i.rarity === 'legendarisch' && i.price >= 500 && i.needs >= 40);
      expect(dream.length, slot).toBeGreaterThanOrEqual(1);
    }
  });

  it('isUnlocked compares the known sums to what the item needs', () => {
    const kroon = itemById('kroon')!;
    expect(isUnlocked(kroon, kroon.needs - 1)).toBe(false);
    expect(isUnlocked(kroon, kroon.needs)).toBe(true);
    expect(isUnlocked(itemById('strik')!, 0)).toBe(true);
  });
});
