/** Firestore laat schrijfacties offline onbepaald openstaan; dit maakt er een fout van die de engine kan afhandelen. */
export async function guardWrite<T>(
  run: () => Promise<T>,
  opts: { online: () => boolean; timeoutMs?: number },
): Promise<T> {
  if (!opts.online()) throw new Error('Offline');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Time-out')), opts.timeoutMs ?? 15_000);
  });
  try {
    return await Promise.race([run(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}
