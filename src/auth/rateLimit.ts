type Entry = { count: number; firstAt: number; lastAt: number };

const globalForRateLimit = globalThis as unknown as {
  __headstashRateLimit?: Map<string, Entry>;
};

const store = globalForRateLimit.__headstashRateLimit ?? new Map<string, Entry>();
if (!globalForRateLimit.__headstashRateLimit) {
  globalForRateLimit.__headstashRateLimit = store;
}

export function checkRateLimit(key: string, opts?: { windowMs?: number; max?: number }) {
  const windowMs = opts?.windowMs ?? 60_000; // 1 minute
  const max = opts?.max ?? 8;

  const now = Date.now();
  const existing = store.get(key);

  if (!existing) {
    store.set(key, { count: 1, firstAt: now, lastAt: now });
    return { ok: true, remaining: max - 1 };
  }

  if (now - existing.firstAt > windowMs) {
    store.set(key, { count: 1, firstAt: now, lastAt: now });
    return { ok: true, remaining: max - 1 };
  }

  existing.count += 1;
  existing.lastAt = now;
  store.set(key, existing);

  if (existing.count > max) {
    return { ok: false, remaining: 0 };
  }

  return { ok: true, remaining: max - existing.count };
}
