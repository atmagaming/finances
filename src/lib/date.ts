const PAYMENT_CUTOFF_DAY = 10;

export function formatMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function parseMonth(monthStr: string): [number, number] {
  const parts = monthStr.split("-").map(Number);
  return [parts[0] ?? 0, (parts[1] ?? 1) - 1];
}

export function addMonths(monthStr: string, n: number): string {
  const [y, m] = parseMonth(monthStr);
  const d = new Date(y, m + n, 1);
  return formatMonth(d.getFullYear(), d.getMonth());
}

export function getLastConfirmedMonth(): string {
  const now = new Date();
  const monthsBack = now.getDate() > PAYMENT_CUTOFF_DAY ? 1 : 2;
  const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  return formatMonth(date.getFullYear(), date.getMonth());
}

export function getMonthRange(start: string, end: string): string[] {
  const months: string[] = [];
  let current = start;
  while (current <= end) {
    months.push(current);
    current = addMonths(current, 1);
  }
  return months;
}
