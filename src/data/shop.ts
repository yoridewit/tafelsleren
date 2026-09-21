export type ItemSlot = 'hoed' | 'sjaal' | 'vleugels' | 'staf' | 'huisdier' | 'achtergrond';

export interface ShopItem {
  id: string;
  name: string;
  slot: ItemSlot;
  price: number;
  /** Eiland dat open moet zijn voordat dit item in de winkel ligt. */
  island: number;
}

export const SLOTS: { slot: ItemSlot; label: string; emoji: string }[] = [
  { slot: 'hoed', label: 'Hoedjes', emoji: '👒' },
  { slot: 'sjaal', label: 'Sjaaltjes', emoji: '🧣' },
  { slot: 'vleugels', label: 'Vleugels', emoji: '🦋' },
  { slot: 'staf', label: 'Toverstaf', emoji: '🪄' },
  { slot: 'huisdier', label: 'Diertjes', emoji: '🐾' },
  { slot: 'achtergrond', label: 'Plekjes', emoji: '🏞️' },
];

export const SHOP: ShopItem[] = [
  { id: 'strik', name: 'Roze strik', slot: 'hoed', price: 10, island: 0 },
  { id: 'feestmuts', name: 'Feestmuts', slot: 'hoed', price: 15, island: 0 },
  { id: 'bloemenkrans', name: 'Bloemenkrans', slot: 'hoed', price: 25, island: 1 },
  { id: 'heksenhoed', name: 'Toverhoed', slot: 'hoed', price: 40, island: 3 },
  { id: 'kroon', name: 'Gouden kroon', slot: 'hoed', price: 60, island: 5 },
  { id: 'diadeem', name: 'Sterrendiadeem', slot: 'hoed', price: 90, island: 8 },

  { id: 'sjaal-rood', name: 'Rode sjaal', slot: 'sjaal', price: 10, island: 0 },
  { id: 'parels', name: 'Parelketting', slot: 'sjaal', price: 25, island: 2 },
  { id: 'regenboogsjaal', name: 'Regenboogsjaal', slot: 'sjaal', price: 45, island: 4 },
  { id: 'cape', name: 'Sterrencape', slot: 'sjaal', price: 70, island: 7 },

  { id: 'vlindervleugels', name: 'Vlindervleugels', slot: 'vleugels', price: 30, island: 1 },
  { id: 'gouden-vleugels', name: 'Glittervleugels', slot: 'vleugels', price: 55, island: 4 },
  { id: 'regenboogvleugels', name: 'Regenboogvleugels', slot: 'vleugels', price: 80, island: 6 },

  { id: 'sterrenstaf', name: 'Sterrenstaf', slot: 'staf', price: 15, island: 0 },
  { id: 'hartjesstaf', name: 'Hartjesstaf', slot: 'staf', price: 25, island: 2 },
  { id: 'maanstaf', name: 'Maanstaf', slot: 'staf', price: 45, island: 5 },
  { id: 'regenboogstaf', name: 'Regenboogstaf', slot: 'staf', price: 70, island: 7 },

  { id: 'lieveheersbeestje', name: 'Lieveheersbeestje', slot: 'huisdier', price: 25, island: 1 },
  { id: 'katje', name: 'Katje', slot: 'huisdier', price: 45, island: 3 },
  { id: 'uiltje', name: 'Uiltje', slot: 'huisdier', price: 60, island: 5 },
  { id: 'draakje', name: 'Draakje', slot: 'huisdier', price: 90, island: 7 },
  { id: 'eenhoorn', name: 'Eenhoorntje', slot: 'huisdier', price: 120, island: 8 },

  { id: 'sterrenhemel', name: 'Sterrenhemel', slot: 'achtergrond', price: 30, island: 2 },
  { id: 'regenboog', name: 'Regenboog', slot: 'achtergrond', price: 45, island: 4 },
  { id: 'paddenstoelen', name: 'Paddenstoelenbos', slot: 'achtergrond', price: 60, island: 6 },
  { id: 'kasteel', name: 'Feeënkasteel', slot: 'achtergrond', price: 100, island: 8 },
];

export function itemById(id: string): ShopItem | undefined {
  return SHOP.find((i) => i.id === id);
}
