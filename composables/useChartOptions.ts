export function formatMonthLabel(m: string): string {
  const parts = m.split("-").map(Number);
  return new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

export function quarterTicks(months: string[]): string[] {
  if (months.length === 0) return [];
  const special = new Set([months[0], months[months.length - 1]]);
  return months.filter((m) => {
    const month = Number(m.split("-")[1]);
    return month === 1 || month === 4 || month === 7 || month === 10 || special.has(m);
  });
}
