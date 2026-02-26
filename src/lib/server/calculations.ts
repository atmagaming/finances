import type {
  InvestmentPoint,
  MonthlyExpense,
  ProjectionMonth,
  RevenueShare,
  SensitiveData,
  Transaction,
} from "$lib/types";
import { addMonths, getLastConfirmedMonth, getMonthRange, parseMonth } from "$lib/date";

export function countMondaysInMonth(year: number, month: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, month, day).getDay() === 1) count++;
  }
  return count;
}

export const RELEASE_MONTH = "2027-10";

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
