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
  /** Hoeveel sommen (van de 55) ze uit haar hoofd moet kennen voordat dit item te koop is. */
  needs: number;
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
  { id: 'strik', name: 'Roze strik', slot: 'hoed', price: 15, rarity: 'gewoon', needs: 0 },
  { id: 'paddenstoelhoedje', name: 'Paddenstoelhoedje', slot: 'hoed', price: 20, rarity: 'gewoon', needs: 0 },
  { id: 'strohoedje', name: 'Strohoedje', slot: 'hoed', price: 20, rarity: 'gewoon', needs: 0 },
  { id: 'feestmuts', name: 'Feestmuts', slot: 'hoed', price: 25, rarity: 'gewoon', needs: 0 },
  { id: 'bloemenkrans', name: 'Bloemenkrans', slot: 'hoed', price: 50, rarity: 'zeldzaam', needs: 6 },
  { id: 'pompommuts', name: 'Pompommuts', slot: 'hoed', price: 25, rarity: 'gewoon', needs: 9 },
  { id: 'vlindertooi', name: 'Vlindertooi', slot: 'hoed', price: 55, rarity: 'zeldzaam', needs: 12 },
  { id: 'heksenhoed', name: 'Toverhoed', slot: 'hoed', price: 100, rarity: 'episch', needs: 18 },
  { id: 'kroon', name: 'Gouden kroon', slot: 'hoed', price: 150, rarity: 'episch', needs: 30 },
  { id: 'sneeuwvlokkroon', name: 'Sneeuwvlokkroon', slot: 'hoed', price: 440, rarity: 'legendarisch', needs: 36 },
  { id: 'regenboogkroon', name: 'Regenboogkroon', slot: 'hoed', price: 600, rarity: 'legendarisch', needs: 45 },
  { id: 'diadeem', name: 'Sterrendiadeem', slot: 'hoed', price: 360, rarity: 'legendarisch', needs: 48 },

  { id: 'sjaal-rood', name: 'Rode sjaal', slot: 'sjaal', price: 15, rarity: 'gewoon', needs: 0 },
  { id: 'gestreepte-sjaal', name: 'Gestreepte sjaal', slot: 'sjaal', price: 15, rarity: 'gewoon', needs: 0 },
  { id: 'zonnebloemketting', name: 'Zonnebloemketting', slot: 'sjaal', price: 45, rarity: 'zeldzaam', needs: 6 },
  { id: 'parels', name: 'Parelketting', slot: 'sjaal', price: 50, rarity: 'zeldzaam', needs: 12 },
  { id: 'regenboogsjaal', name: 'Regenboogsjaal', slot: 'sjaal', price: 115, rarity: 'episch', needs: 24 },
  { id: 'wintersjaal', name: 'Wintersjaal', slot: 'sjaal', price: 140, rarity: 'episch', needs: 30 },
  { id: 'cape', name: 'Sterrencape', slot: 'sjaal', price: 280, rarity: 'legendarisch', needs: 42 },
  { id: 'pauwenkraag', name: 'Pauwenkraag', slot: 'sjaal', price: 500, rarity: 'legendarisch', needs: 42 },

  { id: 'bladvleugels', name: 'Bladvleugels', slot: 'vleugels', price: 45, rarity: 'zeldzaam', needs: 6 },
  { id: 'vlindervleugels', name: 'Vlindervleugels', slot: 'vleugels', price: 60, rarity: 'zeldzaam', needs: 6 },
  { id: 'libellevleugels', name: 'Libellevleugels', slot: 'vleugels', price: 55, rarity: 'zeldzaam', needs: 12 },
  { id: 'gouden-vleugels', name: 'Glittervleugels', slot: 'vleugels', price: 140, rarity: 'episch', needs: 24 },
  { id: 'regenboogvleugels', name: 'Regenboogvleugels', slot: 'vleugels', price: 320, rarity: 'legendarisch', needs: 36 },
  { id: 'nachtvlindervleugels', name: 'Nachtvlindervleugels', slot: 'vleugels', price: 380, rarity: 'legendarisch', needs: 36 },
  { id: 'feniksvleugels', name: 'Feniksvleugels', slot: 'vleugels', price: 800, rarity: 'legendarisch', needs: 50 },

  { id: 'bloemenstaf', name: 'Bloemenstaf', slot: 'staf', price: 20, rarity: 'gewoon', needs: 0 },
  { id: 'sterrenstaf', name: 'Sterrenstaf', slot: 'staf', price: 25, rarity: 'gewoon', needs: 0 },
  { id: 'lolliestaf', name: 'Lolliestaf', slot: 'staf', price: 20, rarity: 'gewoon', needs: 3 },
  { id: 'hartjesstaf', name: 'Hartjesstaf', slot: 'staf', price: 50, rarity: 'zeldzaam', needs: 12 },
  { id: 'maanstaf', name: 'Maanstaf', slot: 'staf', price: 115, rarity: 'episch', needs: 30 },
  { id: 'ijsstaf', name: 'IJsstaf', slot: 'staf', price: 145, rarity: 'episch', needs: 30 },
  { id: 'regenboogstaf', name: 'Regenboogstaf', slot: 'staf', price: 280, rarity: 'legendarisch', needs: 42 },
  { id: 'galaxystaf', name: 'Sterrenstelselstaf', slot: 'staf', price: 700, rarity: 'legendarisch', needs: 48 },

  { id: 'eendje', name: 'Eendje', slot: 'huisdier', price: 25, rarity: 'gewoon', needs: 0 },
  { id: 'lieveheersbeestje', name: 'Lieveheersbeestje', slot: 'huisdier', price: 50, rarity: 'zeldzaam', needs: 6 },
  { id: 'konijntje', name: 'Konijntje', slot: 'huisdier', price: 45, rarity: 'zeldzaam', needs: 8 },
  { id: 'vosje', name: 'Vosje', slot: 'huisdier', price: 60, rarity: 'zeldzaam', needs: 12 },
  { id: 'katje', name: 'Katje', slot: 'huisdier', price: 115, rarity: 'episch', needs: 18 },
  { id: 'zeepaardje', name: 'Zeepaardje', slot: 'huisdier', price: 165, rarity: 'episch', needs: 24 },
  { id: 'uiltje', name: 'Uiltje', slot: 'huisdier', price: 150, rarity: 'episch', needs: 30 },
  { id: 'draakje', name: 'Draakje', slot: 'huisdier', price: 360, rarity: 'legendarisch', needs: 42 },
  { id: 'eenhoorn', name: 'Eenhoorntje', slot: 'huisdier', price: 480, rarity: 'legendarisch', needs: 48 },
  { id: 'feniks', name: 'Feniksje', slot: 'huisdier', price: 650, rarity: 'legendarisch', needs: 52 },

  { id: 'bloemenweide', name: 'Bloemenweide', slot: 'achtergrond', price: 50, rarity: 'zeldzaam', needs: 6 },
  { id: 'sterrenhemel', name: 'Sterrenhemel', slot: 'achtergrond', price: 60, rarity: 'zeldzaam', needs: 12 },
  { id: 'winterbos', name: 'Winterbos', slot: 'achtergrond', price: 60, rarity: 'zeldzaam', needs: 18 },
  { id: 'regenboog', name: 'Regenboog', slot: 'achtergrond', price: 115, rarity: 'episch', needs: 24 },
  { id: 'onderwaterwereld', name: 'Onderwaterwereld', slot: 'achtergrond', price: 165, rarity: 'episch', needs: 24 },
  { id: 'paddenstoelen', name: 'Paddenstoelenbos', slot: 'achtergrond', price: 150, rarity: 'episch', needs: 36 },
  { id: 'melkweg', name: 'Melkweg', slot: 'achtergrond', price: 550, rarity: 'legendarisch', needs: 40 },
  { id: 'wolkenrijk', name: 'Wolkenrijk', slot: 'achtergrond', price: 480, rarity: 'legendarisch', needs: 42 },
  { id: 'kasteel', name: 'Feeënkasteel', slot: 'achtergrond', price: 400, rarity: 'legendarisch', needs: 48 },
];

/** Of een item te koop is voor iemand die zoveel sommen uit het hoofd kent. */
export function isUnlocked(item: ShopItem, known: number): boolean {
  return known >= item.needs;
}

export function itemById(id: string): ShopItem | undefined {
  return SHOP.find((i) => i.id === id);
}
