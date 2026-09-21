export type Screen =
  | { name: 'home' }
  | { name: 'island'; island: number }
  | { name: 'discover'; island: number }
  | { name: 'round'; island: number }
  | { name: 'result'; island: number; correct: number; total: number; stars: number }
  | { name: 'shop' }
  | { name: 'album' }
  | { name: 'speed' }
  | { name: 'gate' }
  | { name: 'parent' };

export type Go = (s: Screen) => void;
