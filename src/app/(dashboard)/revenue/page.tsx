import { InvestmentChart } from "@/components/investment-chart";
import { NoSSR } from "@/components/no-ssr";
import { RevenueChart } from "@/components/revenue-chart";
import { calculateInvestmentTimeline, calculateRevenueShares } from "@/lib/calculations";
import { getAllData } from "@/lib/data";

export default async function RevenuePage() {
  const { transactions, sensitiveData, payees, people } = await getAllData();

  const payeePersonMap = new Map<string, string>();
  for (const payee of payees) {
    if (payee.personId) payeePersonMap.set(payee.id, payee.personId);
  }

  const personNames = new Map<string, string>();
  for (const person of people) personNames.set(person.id, person.name);

  const revenueShares = calculateRevenueShares(transactions, sensitiveData, payeePersonMap, personNames);
  const investmentTimeline = calculateInvestmentTimeline(transactions, sensitiveData, payeePersonMap, personNames, 18);

  // Cumulative historical investments
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

  // Current snapshot for the table
  const currentSnapshot = revenueShares.length > 0 ? revenueShares[revenueShares.length - 1] : null;
  const currentShares = currentSnapshot ? Object.entries(currentSnapshot.shares).sort(([, a], [, b]) => b - a) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revenue Share</h1>

      <NoSSR>
        <RevenueChart data={revenueShares} />
      </NoSSR>
      <NoSSR>
        <InvestmentChart data={investmentTimeline} />
      </NoSSR>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Current Snapshot (Projected to{" "}
          {currentSnapshot?.month
            ? (() => {
                const [y, m] = currentSnapshot.month.split("-").map(Number);
                return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
              })()
            : "—"}
          )
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Person
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Historical Investment (USD)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Projected Share (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {currentShares.map(([name, pct]) => {
                const personId = [...personNames.entries()].find(([, n]) => n === name)?.[0];
                const historicalInvestment = personId ? (cumulativeByPerson.get(personId) ?? 0) : 0;
                return (
                  <tr
                    key={name}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors"
                  >
                    <td className="px-4 py-2 text-sm font-medium">{name}</td>
                    <td className="px-4 py-2 text-right text-sm font-mono">
                      ${historicalInvestment.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-mono font-bold text-[var(--accent)]">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
