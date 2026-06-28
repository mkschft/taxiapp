// Compact relative-day formatting for "Last practiced …" labels.
// Returns null when there's no timestamp (e.g. never practiced, or the backend
// hasn't started sending lastPracticedAt yet — see BE-1).
export function formatRelativeDay(ts: number | null | undefined): string | null {
  if (ts == null) return null;
  const diff = Date.now() - ts;
  if (diff < 0) return 'today';

  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 28) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
