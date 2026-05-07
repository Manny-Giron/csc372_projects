/** Mirrors api/src/routes/contracts.js for client-side summary display. */
const DELIVERY_FEE = 15.0;
const TAX_RATE = 0.0825;
const MAX_BILLING_DAYS = 30;

/** Earliest delivery window starts this many hours from booking time (matches API). */
export const MIN_RESERVATION_LEAD_HOURS = 4;

function toLocalDateTime(d: string, t: string): Date {
  if (!d) return new Date(NaN);
  const raw = t || '09:00';
  const withSeconds = raw.split(':').length === 2 ? `${raw}:00` : raw;
  return new Date(`${d}T${withSeconds}`);
}

/** ISO local fragment for the API: `YYYY-MM-DDTHH:mm:ss` (matches contracts route parsing). */
export function buildScheduleIso(d: string, t: string): string {
  if (!d) return '';
  const raw = t || '09:00';
  const withSeconds = raw.split(':').length === 2 ? `${raw}:00` : raw;
  return `${d}T${withSeconds}`;
}

export function parseScheduleWindow(
  deliveryDate: string,
  deliveryTime: string,
  pickupDate: string,
  pickupTime: string
): { start: Date; end: Date } | null {
  if (!deliveryDate || !pickupDate) return null;
  const start = toLocalDateTime(deliveryDate, deliveryTime || '09:00');
  const end = toLocalDateTime(pickupDate, pickupTime || '17:00');
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }
  return { start, end };
}
////
////
////
////
////
/**
 * Billing days from delivery → pickup window: ceil(hours/24), min 1, cap {MAX_BILLING_DAYS}.
 * Aligned with server: daily * rentalDays * quantity.
 */
/** Delivery start must be at least `leadHours` from now (clock-time). */
export function deliveryMeetsMinimumLead(
  deliveryDate: string,
  deliveryTime: string,
  leadHours: number = MIN_RESERVATION_LEAD_HOURS
): boolean {
  const start = toLocalDateTime(deliveryDate, deliveryTime || '09:00');
  if (Number.isNaN(start.getTime())) return false;
  const minMs = Date.now() + leadHours * 60 * 60 * 1000;
  return start.getTime() >= minMs;
}
////
////
////
////
////
export function rentalDaysFromSchedule(
  deliveryDate: string,
  deliveryTime: string,
  pickupDate: string,
  pickupTime: string
): number {
  const w = parseScheduleWindow(deliveryDate, deliveryTime, pickupDate, pickupTime);
  if (!w) return 1;
  const ms = w.end.getTime() - w.start.getTime();
  const hours = Math.ceil(ms / (1000 * 60 * 60));
  return Math.max(1, Math.min(MAX_BILLING_DAYS, Math.ceil(hours / 24)));
}

export function computeCartTotals(
  items: { toolId: number; quantity: number }[],
  priceMap: Record<number, { daily_rate: number; deposit: number }>,
  rentalDays: number,
  fulfillmentMode: 'delivery' | 'pickup'
) {
  let subtotal = 0;
  let depositTotal = 0;
  for (const line of items) {
    const p = priceMap[line.toolId];
    if (!p) continue;
    const daily = Number(p.daily_rate);
    const dep = Number(p.deposit);
    subtotal += daily * rentalDays * line.quantity;
    depositTotal += dep * line.quantity;
  }
  const feesTotal = fulfillmentMode === 'delivery' ? DELIVERY_FEE : 0;
  const taxable = subtotal + feesTotal;
  const taxTotal = Math.round(taxable * TAX_RATE * 100) / 100;
  const grandTotal = Math.round((taxable + taxTotal) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: feesTotal,
    depositTotal: Math.round(depositTotal * 100) / 100,
    taxTotal,
    grandTotal,
  };
}
