/** Límite ligero en memoria por IP (se reinicia en cold start del servidor). */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 8;

const store = new Map<string, { count: number; resetAt: number }>();

export function isTestimonialRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_SUBMISSIONS_PER_WINDOW;
}
