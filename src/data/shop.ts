export type ItemSlot = 'hoed' | 'sjaal' | 'vleugels' | 'staf' | 'huisdier' | 'achtergrond';

export type Rarity = 'gewoon' | 'zeldzaam' | 'episch' | 'legendarisch';

export const RARITIES: { rarity: Rarity; label: string; color: string }[] = [
  { rarity: 'gewoon', label: 'Gewoon', color: '#94a3b8' },
  { rarity: 'zeldzaam', label: 'Zeldzaam', color: '#38bdf8' },
  { rarity: 'episch', label: 'Episch', color: '#a78bfa' },
  { rarity: 'legendarisch', label: 'Legendarisch', color: '#f59e0b' },
];

export function rarityInfo(r: Rarity) {
  return RARITIES.find((x) => x.rarity === r)!;
}

export interface ShopItem {
  id: string;
  name: string;
  slot: ItemSlot;
  price: number;
  rarity: Rarity;
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
  { id: 'strik', name: 'Roze strik', slot: 'hoed', price: 10, rarity: 'gewoon', island: 0 },
  { id: 'paddenstoelhoedje', name: 'Paddenstoelhoedje', slot: 'hoed', price: 12, rarity: 'gewoon', island: 0 },
  { id: 'feestmuts', name: 'Feestmuts', slot: 'hoed', price: 15, rarity: 'gewoon', island: 0 },
  { id: 'bloemenkrans', name: 'Bloemenkrans', slot: 'hoed', price: 25, rarity: 'zeldzaam', island: 1 },
  { id: 'vlindertooi', name: 'Vlindertooi', slot: 'hoed', price: 28, rarity: 'zeldzaam', island: 2 },
  { id: 'heksenhoed', name: 'Toverhoed', slot: 'hoed', price: 40, rarity: 'episch', island: 3 },
  { id: 'kroon', name: 'Gouden kroon', slot: 'hoed', price: 60, rarity: 'episch', island: 5 },
  { id: 'sneeuwvlokkroon', name: 'Sneeuwvlokkroon', slot: 'hoed', price: 110, rarity: 'legendarisch', island: 6 },
  { id: 'diadeem', name: 'Sterrendiadeem', slot: 'hoed', price: 90, rarity: 'legendarisch', island: 8 },

  { id: 'sjaal-rood', name: 'Rode sjaal', slot: 'sjaal', price: 10, rarity: 'gewoon', island: 0 },
  { id: 'zonnebloemketting', name: 'Zonnebloemketting', slot: 'sjaal', price: 22, rarity: 'zeldzaam', island: 1 },
  { id: 'parels', name: 'Parelketting', slot: 'sjaal', price: 25, rarity: 'zeldzaam', island: 2 },
  { id: 'regenboogsjaal', name: 'Regenboogsjaal', slot: 'sjaal', price: 45, rarity: 'episch', island: 4 },
  { id: 'wintersjaal', name: 'Wintersjaal', slot: 'sjaal', price: 55, rarity: 'episch', island: 5 },
  { id: 'cape', name: 'Sterrencape', slot: 'sjaal', price: 70, rarity: 'legendarisch', island: 7 },

  { id: 'vlindervleugels', name: 'Vlindervleugels', slot: 'vleugels', price: 30, rarity: 'zeldzaam', island: 1 },
  { id: 'libellevleugels', name: 'Libellevleugels', slot: 'vleugels', price: 28, rarity: 'zeldzaam', island: 2 },
  { id: 'gouden-vleugels', name: 'Glittervleugels', slot: 'vleugels', price: 55, rarity: 'episch', island: 4 },
  { id: 'nachtvlindervleugels', name: 'Nachtvlindervleugels', slot: 'vleugels', price: 95, rarity: 'legendarisch', island: 6 },
  { id: 'regenboogvleugels', name: 'Regenboogvleugels', slot: 'vleugels', price: 80, rarity: 'legendarisch', island: 6 },

  { id: 'sterrenstaf', name: 'Sterrenstaf', slot: 'staf', price: 15, rarity: 'gewoon', island: 0 },
  { id: 'bloemenstaf', name: 'Bloemenstaf', slot: 'staf', price: 12, rarity: 'gewoon', island: 0 },
  { id: 'hartjesstaf', name: 'Hartjesstaf', slot: 'staf', price: 25, rarity: 'zeldzaam', island: 2 },
  { id: 'maanstaf', name: 'Maanstaf', slot: 'staf', price: 45, rarity: 'episch', island: 5 },
  { id: 'ijsstaf', name: 'IJsstaf', slot: 'staf', price: 58, rarity: 'episch', island: 5 },
  { id: 'regenboogstaf', name: 'Regenboogstaf', slot: 'staf', price: 70, rarity: 'legendarisch', island: 7 },

  { id: 'lieveheersbeestje', name: 'Lieveheersbeestje', slot: 'huisdier', price: 25, rarity: 'zeldzaam', island: 1 },
  { id: 'vosje', name: 'Vosje', slot: 'huisdier', price: 30, rarity: 'zeldzaam', island: 2 },
  { id: 'katje', name: 'Katje', slot: 'huisdier', price: 45, rarity: 'episch', island: 3 },
  { id: 'zeepaardje', name: 'Zeepaardje', slot: 'huisdier', price: 65, rarity: 'episch', island: 4 },
  { id: 'uiltje', name: 'Uiltje', slot: 'huisdier', price: 60, rarity: 'episch', island: 5 },
  { id: 'draakje', name: 'Draakje', slot: 'huisdier', price: 90, rarity: 'legendarisch', island: 7 },
  { id: 'eenhoorn', name: 'Eenhoorntje', slot: 'huisdier', price: 120, rarity: 'legendarisch', island: 8 },

  { id: 'sterrenhemel', name: 'Sterrenhemel', slot: 'achtergrond', price: 30, rarity: 'zeldzaam', island: 2 },
  { id: 'winterbos', name: 'Winterbos', slot: 'achtergrond', price: 30, rarity: 'zeldzaam', island: 3 },
  { id: 'regenboog', name: 'Regenboog', slot: 'achtergrond', price: 45, rarity: 'episch', island: 4 },
  { id: 'onderwaterwereld', name: 'Onderwaterwereld', slot: 'achtergrond', price: 65, rarity: 'episch', island: 4 },
  { id: 'paddenstoelen', name: 'Paddenstoelenbos', slot: 'achtergrond', price: 60, rarity: 'episch', island: 6 },
  { id: 'wolkenrijk', name: 'Wolkenrijk', slot: 'achtergrond', price: 120, rarity: 'legendarisch', island: 7 },
  { id: 'kasteel', name: 'Feeënkasteel', slot: 'achtergrond', price: 100, rarity: 'legendarisch', island: 8 },
];

export function itemById(id: string): ShopItem | undefined {
  return SHOP.find((i) => i.id === id);
}
