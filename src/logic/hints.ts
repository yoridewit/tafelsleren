export interface Hint {
  title: string;
  tip: string;
  steps: string[];
  flipped: boolean;
}

/** Hoe makkelijk een vermenigvuldiger is (lager = makkelijker). */
const RANK: Record<number, number> = { 1: 0, 10: 1, 2: 2, 5: 3, 9: 4, 4: 5, 6: 6, 3: 7, 8: 8, 7: 9 };

/** Hint voor a × b (a = hoeveel keer, b = de tafel). */
export function hintFor(a: number, b: number): Hint {
  const flipped = RANK[b] < RANK[a];
  const m = flipped ? b : a;
  const n = flipped ? a : b;
  const pre = flipped ? [`${a} × ${b} = ${b} × ${a}`] : [];
  const x = (k: number) => `${k} × ${n} = ${k * n}`;
  let title: string;
  let tip: string;
  let steps: string[];
  switch (m) {
    case 1:
      title = 'Keer 1';
      tip = `1 keer ${n} is gewoon ${n}.`;
      steps = [x(1)];
      break;
    case 2:
      title = 'Dubbel';
      tip = `2 keer is het dubbele.`;
      steps = [`${n} + ${n} = ${2 * n}`];
      break;
    case 10:
      title = 'Keer 10';
      tip = `Zet een 0 achter ${n}.`;
      steps = [x(10)];
      break;
    case 5:
      title = 'De helft van 10 keer';
      tip = `5 keer is de helft van 10 keer.`;
      steps = [x(10), `De helft van ${10 * n} = ${5 * n}`];
      break;
    case 9:
      title = 'Rond de 10';
      tip = `Eerst 10 keer, dan één ${n} eraf.`;
      steps = [x(10), `${10 * n} − ${n} = ${9 * n}`];
      break;
    case 4:
      title = 'Dubbel dubbel';
      tip = `4 keer is het dubbele van 2 keer.`;
      steps = [x(2), `${2 * n} + ${2 * n} = ${4 * n}`];
      break;
    case 6:
      title = 'Rondom de 5';
      tip = `Eerst 5 keer, dan één ${n} erbij.`;
      steps = [x(5), `${5 * n} + ${n} = ${6 * n}`];
      break;
    case 3:
      title = '2 keer en nog één';
      tip = `Eerst 2 keer, dan één ${n} erbij.`;
      steps = [x(2), `${2 * n} + ${n} = ${3 * n}`];
      break;
    case 8:
      title = 'Drie keer dubbel';
      tip = `Dubbel, nog eens dubbel en nog eens dubbel.`;
      steps = [x(2), x(4), `${4 * n} + ${4 * n} = ${8 * n}`];
      break;
    default:
      title = '5 keer + 2 keer';
      tip = `7 keer is 5 keer plus 2 keer.`;
      steps = [x(5), x(2), `${5 * n} + ${2 * n} = ${7 * n}`];
  }
  if (flipped) tip = `Draai om! ${tip}`;
  return { title, tip, steps: [...pre, ...steps], flipped };
}
