/**
 * Een verkeerd antwoord dat waarschijnlijk een tikfout is, geen rekenfout: te vroeg op "klaar" gedrukt
 * (18 → "1") of de cijfers omgedraaid (18 → "81"). Alleen bij antwoorden van twee of meer cijfers.
 */
export function isSlip(given: string, answer: number): boolean {
  const a = String(answer);
  if (a.length < 2 || given === '' || given === a) return false;
  if (given.length < a.length && a.startsWith(given)) return true;
  if (given.length === a.length && [...given].sort().join('') === [...a].sort().join('')) return true;
  return false;
}
