/** Compact US-friendly display: MM-DD-YYYY and h:mm AM/PM (local). */
export function formatScheduleDisplay(raw: string | null | undefined): string {
  if (raw == null || raw === '') return '—';
  const s = String(raw).trim();
  if (!s) return '—';
  const normalized = s.includes('T') ? s : s.replace(/^(\d{4}-\d{2}-\d{2})[\s](.+)$/, '$1T$2');
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return String(raw);

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();

  let h24 = d.getHours();
  const mins = d.getMinutes();
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  const timeStr = `${h12}:${String(mins).padStart(2, '0')} ${ampm}`;

  return `${mm}-${dd}-${yyyy}  ${timeStr}`;
}
