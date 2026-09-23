import type { SyncStatus } from './sync';

const time = (iso: string) => new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

export function statusText(status: SyncStatus): string {
  switch (status.kind) {
    case 'off':
      return 'Niet ingesteld';
    case 'signedOut':
      return 'Niet ingelogd';
    case 'syncing':
      return 'Bezig met opslaan…';
    case 'synced':
      return `Laatst opgeslagen ${time(status.at)}`;
    case 'offline':
      return 'Offline, wordt later opgeslagen';
    case 'error':
      return 'Opslaan mislukt, wordt opnieuw geprobeerd';
  }
}
