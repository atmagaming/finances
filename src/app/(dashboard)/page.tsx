import { auth } from "@/auth";
import { ExpenseChart } from "@/components/expense-chart";
import { InvestmentChart } from "@/components/investment-chart";
import { NoSSR } from "@/components/no-ssr";
import { RevenueChart } from "@/components/revenue-chart";
import {
  aggregateExpensesByMonth,
  calculateInvestmentTimeline,
  calculateRevenueShares,
  projectExpenses,
  RELEASE_MONTH,
} from "@/lib/calculations";
import { getAllData } from "@/lib/data";

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

export default async function OverviewPage() {
  const session = await auth();
  const currentPersonId = session?.user?.personId ?? null;
  const isAuthenticated = !!session;

  const { transactions, sensitiveData, payees, people } = await getAllData();

  // Expense chart data
  const monthlyExpenses = aggregateExpensesByMonth(transactions);
  const projections = projectExpenses(sensitiveData, RELEASE_MONTH);

  // Summary cards
  const n = monthlyExpenses.length;
  const avgPaid = n > 0 ? Math.round(monthlyExpenses.reduce((s, m) => s + m.paid, 0) / n) : 0;
  const avgAccrued = n > 0 ? Math.round(monthlyExpenses.reduce((s, m) => s + m.accrued, 0) / n) : 0;
  const avgTotal = avgPaid + avgAccrued;

  const cards = [
    { label: "Avg Monthly Paid", value: avgPaid, color: "var(--red)", bg: "#fef2f2" },
    { label: "Avg Monthly Accrued", value: avgAccrued, color: "var(--orange)", bg: "#fffbeb" },
    { label: "Avg Monthly Total", value: avgTotal, color: "var(--blue)", bg: "#eff6ff" },
  ];

  // Revenue share & investment data
  const payeePersonMap = new Map<string, string>();
  for (const payee of payees) {
    if (payee.personId) payeePersonMap.set(payee.id, payee.personId);
  }

  const personNames = new Map<string, string>();
  for (const person of people) personNames.set(person.id, person.name);

  const revenueShares = calculateRevenueShares(transactions, sensitiveData, payeePersonMap, personNames, RELEASE_MONTH);
  const investmentTimeline = calculateInvestmentTimeline(
    transactions,
    sensitiveData,
    payeePersonMap,
    personNames,
    RELEASE_MONTH,
  );

  const currentUserName = currentPersonId ? (personNames.get(currentPersonId) ?? null) : null;
  const anonymizedRevenueShares = revenueShares.map((rs) => ({ ...rs, shares: anonymize(rs.shares, currentUserName) }));
  const anonymizedInvestmentTimeline = investmentTimeline.map((ip) => ({
    ...ip,
    values: anonymize(ip.values, currentUserName),
  }));

  // Cumulative historical investments per person
  const cumulativeByPerson = new Map<string, number>();
  for (const tx of transactions) {
    const personId = payeePersonMap.get(tx.payeeId);
    if (!personId) continue;
    if (tx.method === "Accrued") {
      cumulativeByPerson.set(personId, (cumulativeByPerson.get(personId) ?? 0) + Math.abs(tx.usdEquivalent));
    } else if (tx.method === "Invested" && tx.amount > 0) {
      cumulativeByPerson.set(personId, (cumulativeByPerson.get(personId) ?? 0) + Math.abs(tx.usdEquivalent));
    }
  }

  // Current and projected revenue shares
  const currentShareEntry = revenueShares.length > 0 ? revenueShares[revenueShares.length - 1] : null;
  const projectedShareEntry = revenueShares.find((rs) => rs.month === "2027-10") ?? null;

  // Build unified table data
  const activeSd = sensitiveData.filter((sd) => sd.status === "Active");

  // Build per-person rows
  const personIds = [...new Set(activeSd.map((sd) => sd.personId))];

  interface TableRow {
    personId: string;
    name: string;
    hoursPerWeek: number;
    paidRate: number;
    investedRate: number;
    monthlyPaid: number;
    monthlyAccrued: number;
    monthlyTotal: number;
    currentInvestment: number;
    currentShare: number;
    projectedShare: number;
    isCurrentUser: boolean;
  }

  const rows: TableRow[] = personIds.map((personId) => {
    const personSd = activeSd.filter((sd) => sd.personId === personId);
    const name = personNames.get(personId) ?? personId.slice(0, 8);
    const hoursPerWeek = personSd.reduce((s, sd) => s + sd.hoursPerWeek, 0);

    // Weighted average rates
    const paidRate =
      hoursPerWeek > 0 ? personSd.reduce((s, sd) => s + sd.hoursPerWeek * sd.hourlyPaid, 0) / hoursPerWeek : 0;
    const investedRate =
      hoursPerWeek > 0 ? personSd.reduce((s, sd) => s + sd.hoursPerWeek * sd.hourlyInvested, 0) / hoursPerWeek : 0;

    // Monthly values from Notion formulas
    const monthlyPaid = personSd.reduce((s, sd) => s + sd.monthlyPaid, 0);
    const monthlyAccrued = personSd.reduce((s, sd) => s + sd.monthlyInvested, 0);
    const monthlyTotal = personSd.reduce((s, sd) => s + sd.monthlyTotal, 0);

    const currentInvestment = cumulativeByPerson.get(personId) ?? 0;
    const currentShare = currentShareEntry?.shares[name] ?? 0;
    const projectedShare = projectedShareEntry?.shares[name] ?? 0;

    return {
      personId,
      name,
      hoursPerWeek,
      paidRate,
      investedRate,
      monthlyPaid,
      monthlyAccrued,
      monthlyTotal,
      currentInvestment,
      currentShare,
      projectedShare,
      isCurrentUser: personId === currentPersonId,
    };
  });

  // Split into user rows and others
  const myRows = currentPersonId ? rows.filter((r) => r.isCurrentUser) : [];
  const otherRows = rows.filter((r) => !r.isCurrentUser);

  // Aggregation helper
  function aggregateRows(rowSet: TableRow[]) {
    const totalHours = rowSet.reduce((s, r) => s + r.hoursPerWeek, 0);
    return {
      hoursPerWeek: totalHours,
      paidRate: totalHours > 0 ? rowSet.reduce((s, r) => s + r.hoursPerWeek * r.paidRate, 0) / totalHours : 0,
      investedRate: totalHours > 0 ? rowSet.reduce((s, r) => s + r.hoursPerWeek * r.investedRate, 0) / totalHours : 0,
      monthlyPaid: rowSet.reduce((s, r) => s + r.monthlyPaid, 0),
      monthlyAccrued: rowSet.reduce((s, r) => s + r.monthlyAccrued, 0),
      monthlyTotal: rowSet.reduce((s, r) => s + r.monthlyTotal, 0),
      currentInvestment: rowSet.reduce((s, r) => s + r.currentInvestment, 0),
      currentShare: rowSet.reduce((s, r) => s + r.currentShare, 0),
      projectedShare: rowSet.reduce((s, r) => s + r.projectedShare, 0),
    };
  }

  const othersAgg = aggregateRows(otherRows);
  const teamAgg = aggregateRows(rows);
  const othersCount = new Set(otherRows.map((r) => r.personId)).size;
  const teamCount = personIds.length;

  const thClass =
    "px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap";

  function renderDataRow(
    key: string,
    label: string,
    data: ReturnType<typeof aggregateRows>,
    highlight: boolean,
    muted: boolean,
  ) {
    const textClass = muted ? "text-[var(--text-muted)]" : "";
    return (
      <tr
        key={key}
        className={`border-b border-[var(--border)] transition-colors ${highlight ? "" : "hover:bg-[var(--bg-card-hover)]"}`}
        style={highlight ? { background: "var(--accent-light)" } : undefined}
      >
        <td className={`px-4 py-3 text-sm font-medium ${textClass}`}>{label}</td>
        <td className={`px-4 py-3 text-right text-sm font-mono ${textClass}`}>{data.hoursPerWeek}</td>
        <td className="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">${Math.round(data.paidRate)}/hr</td>
        <td className="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">
          ${Math.round(data.investedRate)}/hr
        </td>
        <td className={`px-4 py-3 text-right text-sm font-mono ${textClass}`}>${data.monthlyPaid.toLocaleString()}</td>
        <td className={`px-4 py-3 text-right text-sm font-mono ${textClass}`}>
          ${data.monthlyAccrued.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right text-sm font-mono font-bold">${data.monthlyTotal.toLocaleString()}</td>
        <td className={`px-4 py-3 text-right text-sm font-mono ${textClass}`}>
          ${data.currentInvestment.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right text-sm font-mono font-bold text-[var(--accent)]">
          {data.currentShare.toFixed(1)}%
        </td>
        <td className="px-4 py-3 text-right text-sm font-mono text-[var(--accent)]">
          {data.projectedShare.toFixed(1)}%
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">Financial Overview</h1>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-5"
            style={{ background: card.bg, boxShadow: "var(--shadow-sm)" }}
          >
            <p className="text-xs font-medium text-[var(--text-muted)]">{card.label}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: card.color }}>
              ${card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <NoSSR>
        <ExpenseChart historical={monthlyExpenses} projections={projections} />
      </NoSSR>
      <NoSSR>
        <RevenueChart data={anonymizedRevenueShares} />
      </NoSSR>
      <NoSSR>
        <InvestmentChart data={anonymizedInvestmentTimeline} />
      </NoSSR>

      <div className="rounded-xl bg-[var(--bg-card)] p-6" style={{ boxShadow: "var(--shadow)" }}>
        <h2 className="mb-4 text-lg font-semibold">Active Team Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Person
                </th>
                <th className={thClass}>Hours/Week</th>
                <th className={thClass}>Paid $/hr</th>
                <th className={thClass}>Invested $/hr</th>
                <th className={thClass}>Monthly Paid</th>
                <th className={thClass}>Monthly Accrued</th>
                <th className={thClass}>Monthly Total</th>
                <th className={thClass}>Current Investment</th>
                <th className={thClass}>Current Share</th>
                <th className={thClass}>Projected Share (Oct 2027)</th>
              </tr>
            </thead>
            <tbody>
              {isAuthenticated ? (
                <>
                  {myRows.map((row) => renderDataRow(row.personId, `${row.name} (You)`, row, true, false))}
                  {otherRows.length > 0 && renderDataRow("others", `Others (${othersCount})`, othersAgg, false, true)}
                </>
              ) : (
                renderDataRow("team", `Team (${teamCount})`, teamAgg, false, false)
              )}
              {isAuthenticated && renderDataRow("total", `Total (${teamCount})`, teamAgg, false, false)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
