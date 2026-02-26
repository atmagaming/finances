import type { RequestHandler } from "./$types";
import {
  aggregateExpensesByMonth,
  calculateInvestmentTimeline,
  calculateRevenueShares,
  projectExpenses,
  RELEASE_MONTH,
} from "$lib/server/calculations";
import { getAllData } from "$lib/server/data";

function anonymize(record: Record<string, number>, myName: string | null): Record<string, number> {
  let me = 0;
  let others = 0;
  for (const [name, value] of Object.entries(record)) {
    if (name === myName) me += value;
    else others += value;
  }
  const result: Record<string, number> = {};
  if (myName && me > 0) result[myName] = me;
  if (others > 0) result.Others = others;
  return result;
}

export const GET: RequestHandler = async ({ locals }) => {
  const currentPersonId = locals.user?.personId ?? null;
  const isAdmin = locals.user?.isAdmin ?? false;
  const isAuthenticated = !!locals.user;

  const { transactions, sensitiveData, people } = await getAllData();

  const monthlyExpenses = aggregateExpensesByMonth(transactions);
  const projections = projectExpenses(sensitiveData, RELEASE_MONTH);

  const activeSensitiveData = sensitiveData.filter((sd) => sd.status === "Active");
  const monthlyPaid = Math.round(activeSensitiveData.reduce((s, sd) => s + sd.monthlyPaid, 0));
  const monthlyAccrued = Math.round(activeSensitiveData.reduce((s, sd) => s + sd.monthlyInvested, 0));
  const monthlyTotal = monthlyPaid + monthlyAccrued;

  const personNames = new Map<string, string>();
  for (const person of people) personNames.set(person.id, person.name);

  const revenueShares = calculateRevenueShares(transactions, sensitiveData, personNames, RELEASE_MONTH);
  const investmentTimeline = calculateInvestmentTimeline(transactions, sensitiveData, personNames, RELEASE_MONTH);

  const currentUserName = currentPersonId ? (personNames.get(currentPersonId) ?? null) : null;
  const displayRevenueShares = isAdmin
    ? revenueShares
    : revenueShares.map((rs) => ({ ...rs, shares: anonymize(rs.shares, currentUserName) }));
  const displayInvestmentTimeline = isAdmin
    ? investmentTimeline
    : investmentTimeline.map((ip) => ({ ...ip, values: anonymize(ip.values, currentUserName) }));

  const investmentByPerson = new Map<string, number>();
  for (const tx of transactions) {
    if (!tx.personId) continue;
    if (tx.method !== "Accrued" && !(tx.method === "Invested" && tx.amount > 0)) continue;
    const current = investmentByPerson.get(tx.personId) ?? 0;
    investmentByPerson.set(tx.personId, current + Math.abs(tx.usdEquivalent));
  }

  const currentShareEntry = revenueShares.length > 0 ? revenueShares[revenueShares.length - 1] : null;
  const projectedShareEntry = revenueShares.find((rs) => rs.month === "2027-10") ?? null;

  const personIds = [...new Set(activeSensitiveData.map((sd) => sd.personId))];

  const rows = personIds.map((personId) => {
    const personSd = activeSensitiveData.filter((sd) => sd.personId === personId);
    const name = personNames.get(personId) ?? personId.slice(0, 8);
    const hoursPerWeek = personSd.reduce((s, sd) => s + sd.hoursPerWeek, 0);

    const paidRate =
      hoursPerWeek > 0 ? personSd.reduce((s, sd) => s + sd.hoursPerWeek * sd.hourlyPaid, 0) / hoursPerWeek : 0;
    const investedRate =
      hoursPerWeek > 0
        ? personSd.reduce((s, sd) => s + sd.hoursPerWeek * sd.hourlyInvested, 0) / hoursPerWeek
        : 0;

    const monthlyPaidPerson = personSd.reduce((s, sd) => s + sd.monthlyPaid, 0);
    const monthlyAccruedPerson = personSd.reduce((s, sd) => s + sd.monthlyInvested, 0);
    const monthlyTotalPerson = personSd.reduce((s, sd) => s + sd.monthlyTotal, 0);

    const currentInvestment = investmentByPerson.get(personId) ?? 0;
    const currentShare = currentShareEntry?.shares[name] ?? 0;
    const projectedShare = projectedShareEntry?.shares[name] ?? 0;

    return {
      personId,
      name,
      hoursPerWeek,
      paidRate,
      investedRate,
      monthlyPaid: monthlyPaidPerson,
      monthlyAccrued: monthlyAccruedPerson,
      monthlyTotal: monthlyTotalPerson,
      currentInvestment,
      currentShare,
      projectedShare,
      isCurrentUser: personId === currentPersonId,
    };
  });

  return new Response(
    JSON.stringify({
      cards: [
        { label: "Monthly Paid", value: monthlyPaid, color: "var(--red)", bg: "#fef2f2" },
        { label: "Monthly Accrued", value: monthlyAccrued, color: "var(--orange)", bg: "#fffbeb" },
        { label: "Monthly Total", value: monthlyTotal, color: "var(--blue)", bg: "#eff6ff" },
      ],
      monthlyExpenses,
      projections,
      revenueShares: displayRevenueShares,
      investmentTimeline: displayInvestmentTimeline,
      teamRows: rows,
      currentPersonId,
      isAdmin,
      isAuthenticated,
      teamCount: personIds.length,
    }),
    { headers: { "content-type": "application/json" } },
  );
};
