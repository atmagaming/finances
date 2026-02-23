import type {
  InvestmentPoint,
  MonthlyExpense,
  ProjectionMonth,
  RevenueShare,
  SensitiveData,
  Transaction,
} from "~/types";

/** Count Mondays (sprint starts) in a given month */
export function countMondaysInMonth(year: number, month: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, month, day).getDay() === 1) count++;
  }
  return count;
}

/** Format date as YYYY-MM */
function formatMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** Parse YYYY-MM to [year, month] */
function parseMonth(monthStr: string): [number, number] {
  const parts = monthStr.split("-").map(Number);
  return [parts[0] ?? 0, (parts[1] ?? 1) - 1];
}

/** Add N months to a YYYY-MM string */
function addMonths(monthStr: string, n: number): string {
  const [y, m] = parseMonth(monthStr);
  const d = new Date(y, m + n, 1);
  return formatMonth(d.getFullYear(), d.getMonth());
}

export const RELEASE_MONTH = "2027-10";

const PAYMENT_CUTOFF_DAY = 10;

/** Last month whose payments are fully confirmed (paid by the 10th of the following month) */
export function getLastConfirmedMonth(): string {
  const now = new Date();
  const monthsBack = now.getDate() > PAYMENT_CUTOFF_DAY ? 1 : 2;
  const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  return formatMonth(date.getFullYear(), date.getMonth());
}

/** Get all months between two YYYY-MM strings, inclusive */
export function getMonthRange(start: string, end: string): string[] {
  const months: string[] = [];
  let current = start;
  while (current <= end) {
    months.push(current);
    current = addMonths(current, 1);
  }
  return months;
}

/** Aggregate historical transactions by month */
export function aggregateExpensesByMonth(transactions: Transaction[]): MonthlyExpense[] {
  const byMonth = new Map<string, MonthlyExpense>();

  for (const tx of transactions) {
    if (!tx.logicalDate) continue;
    const month = tx.logicalDate.slice(0, 7);
    const existing = byMonth.get(month) ?? { month, paid: 0, accrued: 0, invested: 0, investments: 0 };

    const usd = Math.abs(tx.usdEquivalent);
    switch (tx.method) {
      case "Paid":
        existing.paid += usd;
        break;
      case "Accrued":
        existing.accrued += usd;
        break;
      case "Invested":
        if (tx.amount > 0) existing.investments += usd;
        else existing.invested += usd;
        break;
    }

    byMonth.set(month, existing);
  }

  return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

/** Project future expenses based on active people's rates */
export function projectExpenses(sensitiveData: SensitiveData[], endMonth: string): ProjectionMonth[] {
  const firstUnconfirmed = addMonths(getLastConfirmedMonth(), 1);
  if (firstUnconfirmed > endMonth) return [];

  const months = getMonthRange(firstUnconfirmed, endMonth);
  const projections: ProjectionMonth[] = [];

  for (const monthStr of months) {
    const [year, month] = parseMonth(monthStr);
    const mondays = countMondaysInMonth(year, month);

    let paid = 0;
    let accrued = 0;

    for (const sd of sensitiveData) {
      if (sd.status !== "Active") continue;
      if (sd.startDate && sd.startDate > `${monthStr}-31`) continue;
      if (sd.endDate && sd.endDate < `${monthStr}-01`) continue;

      const weeklyPaid = sd.hoursPerWeek * sd.hourlyPaid;
      const weeklyAccrued = sd.hoursPerWeek * sd.hourlyInvested;

      paid += weeklyPaid * mondays;
      accrued += weeklyAccrued * mondays;
    }

    projections.push({
      month: monthStr,
      paid: Math.round(paid),
      accrued: Math.round(accrued),
      total: Math.round(paid + accrued),
    });
  }

  return projections;
}

/** Calculate revenue share percentages over time */
export function calculateRevenueShares(
  transactions: Transaction[],
  sensitiveData: SensitiveData[],
  payeePersonMap: Map<string, string>,
  personNames: Map<string, string>,
  endMonth: string,
): RevenueShare[] {
  if (transactions.length === 0) return [];

  const sortedDates = transactions
    .filter((t) => t.logicalDate)
    .map((t) => t.logicalDate)
    .sort();
  const firstMonth = (sortedDates[0] ?? endMonth).slice(0, 7);
  const months = getMonthRange(firstMonth, endMonth);

  const cumulativeInvestments = new Map<string, number>();

  const accruedByMonth = new Map<string, Map<string, number>>();
  const investedByMonth = new Map<string, Map<string, number>>();

  for (const tx of transactions) {
    if (!tx.logicalDate) continue;
    const month = tx.logicalDate.slice(0, 7);
    const personId = payeePersonMap.get(tx.payeeId);
    if (!personId) continue;

    if (tx.method === "Accrued") {
      const monthMap = accruedByMonth.get(month) ?? new Map<string, number>();
      monthMap.set(personId, (monthMap.get(personId) ?? 0) + Math.abs(tx.usdEquivalent));
      accruedByMonth.set(month, monthMap);
    } else if (tx.method === "Invested" && tx.amount > 0) {
      const monthMap = investedByMonth.get(month) ?? new Map<string, number>();
      monthMap.set(personId, (monthMap.get(personId) ?? 0) + Math.abs(tx.usdEquivalent));
      investedByMonth.set(month, monthMap);
    }
  }

  const result: RevenueShare[] = [];
  const lastConfirmed = getLastConfirmedMonth();

  for (const month of months) {
    const accrued = accruedByMonth.get(month);
    if (accrued) {
      for (const [personId, amount] of accrued) {
        cumulativeInvestments.set(personId, (cumulativeInvestments.get(personId) ?? 0) + amount);
      }
    }

    const invested = investedByMonth.get(month);
    if (invested) {
      for (const [personId, amount] of invested) {
        cumulativeInvestments.set(personId, (cumulativeInvestments.get(personId) ?? 0) + amount);
      }
    }

    if (month > lastConfirmed) {
      const [year, m] = parseMonth(month);
      const mondays = countMondaysInMonth(year, m);

      for (const sd of sensitiveData) {
        if (sd.status !== "Active") continue;
        if (!sd.hourlyInvested) continue;
        const weeklyAccrued = sd.hoursPerWeek * sd.hourlyInvested;
        const monthlyAccrued = weeklyAccrued * mondays;
        cumulativeInvestments.set(sd.personId, (cumulativeInvestments.get(sd.personId) ?? 0) + monthlyAccrued);
      }
    }

    const total = [...cumulativeInvestments.values()].reduce((a, b) => a + b, 0);
    if (total === 0) continue;

    const shares: Record<string, number> = {};
    for (const [personId, amount] of cumulativeInvestments) {
      const pct = (amount / total) * 100;
      if (pct >= 0.5) {
        const name = personNames.get(personId) ?? personId.slice(0, 8);
        shares[name] = Math.round(pct * 100) / 100;
      }
    }

    result.push({ month, shares, isProjected: month > lastConfirmed });
  }

  return result;
}

/** Per-month investment increments per person (historical + projected), for the investment timeline chart */
export function calculateInvestmentTimeline(
  transactions: Transaction[],
  sensitiveData: SensitiveData[],
  payeePersonMap: Map<string, string>,
  personNames: Map<string, string>,
  endMonth: string,
): InvestmentPoint[] {
  if (transactions.length === 0) return [];

  const sortedDates = transactions
    .filter((t) => t.logicalDate)
    .map((t) => t.logicalDate)
    .sort();
  const firstMonth = (sortedDates[0] ?? endMonth).slice(0, 7);
  const lastConfirmed = getLastConfirmedMonth();
  const months = getMonthRange(firstMonth, endMonth);

  const accruedByMonth = new Map<string, Map<string, number>>();
  const investedByMonth = new Map<string, Map<string, number>>();

  for (const tx of transactions) {
    if (!tx.logicalDate) continue;
    const month = tx.logicalDate.slice(0, 7);
    const personId = payeePersonMap.get(tx.payeeId);
    if (!personId) continue;

    if (tx.method === "Accrued") {
      const m = accruedByMonth.get(month) ?? new Map<string, number>();
      m.set(personId, (m.get(personId) ?? 0) + Math.abs(tx.usdEquivalent));
      accruedByMonth.set(month, m);
    } else if (tx.method === "Invested" && tx.amount > 0) {
      const m = investedByMonth.get(month) ?? new Map<string, number>();
      m.set(personId, (m.get(personId) ?? 0) + Math.abs(tx.usdEquivalent));
      investedByMonth.set(month, m);
    }
  }

  const result: InvestmentPoint[] = [];

  for (const month of months) {
    const isProjected = month > lastConfirmed;
    const values: Record<string, number> = {};

    if (!isProjected) {
      const accrued = accruedByMonth.get(month);
      if (accrued) {
        for (const [personId, amount] of accrued) {
          const name = personNames.get(personId) ?? personId.slice(0, 8);
          values[name] = (values[name] ?? 0) + amount;
        }
      }
      const invested = investedByMonth.get(month);
      if (invested) {
        for (const [personId, amount] of invested) {
          const name = personNames.get(personId) ?? personId.slice(0, 8);
          values[name] = (values[name] ?? 0) + amount;
        }
      }
    } else {
      const [year, m] = parseMonth(month);
      const mondays = countMondaysInMonth(year, m);
      for (const sd of sensitiveData) {
        if (sd.status !== "Active") continue;
        if (!sd.hourlyInvested) continue;
        const monthlyAccrued = sd.hoursPerWeek * sd.hourlyInvested * mondays;
        const name = personNames.get(sd.personId) ?? sd.personId.slice(0, 8);
        values[name] = (values[name] ?? 0) + Math.round(monthlyAccrued);
      }
    }

    result.push({ month, values, isProjected });
  }

  return result;
}
