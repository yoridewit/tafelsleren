import type { SaveData } from '../logic/storage';

export type SyncAction = 'none' | 'push' | 'restore';

/** Een save zonder enige voortgang, bijv. een net aangemaakt profiel op een gewist apparaat. */
export function isPristine(save: SaveData): boolean {
  return (
    save.roundsDone === 0 &&
    save.stars === 0 &&
    save.owned.length === 0 &&
    Object.values(save.facts).every((f) => f.seen === 0)
  );
}

function totalSeen(save: SaveData): number {
  return Object.values(save.facts).reduce((sum, f) => sum + f.seen, 0);
}

/** Bepaalt wat er met lokaal en remote moet gebeuren; `remote` is al door `parseSave` gehaald. */
export function decide(local: SaveData | null, remote: SaveData | null): SyncAction {
  if (!remote) return local ? 'push' : 'none';
  if (!local) return 'restore';
  const localEmpty = isPristine(local);
  const remoteEmpty = isPristine(remote);
  if (localEmpty && remoteEmpty) return 'none';
  if (localEmpty) return 'restore';
  if (remoteEmpty) return 'push';
  // Ander createdAt = opnieuw aangemaakt profiel (andere lijn): tijdstempels zeggen dan niets, voortgang wel.
  if (local.createdAt !== remote.createdAt) {
    if (local.roundsDone !== remote.roundsDone) return local.roundsDone > remote.roundsDone ? 'push' : 'restore';
    const ls = totalSeen(local);
    const rs = totalSeen(remote);
    if (ls !== rs) return ls > rs ? 'push' : 'restore';
  }
  const l = Date.parse(local.updatedAt);
  const r = Date.parse(remote.updatedAt);
  if (l === r) return 'none';
  return r > l ? 'restore' : 'push';
}
