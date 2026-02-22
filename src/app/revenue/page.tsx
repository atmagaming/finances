import { getAllData } from "@/lib/data";
import { calculateRevenueShares } from "@/lib/calculations";
import { RevenueChart } from "@/components/revenue-chart";

export default async function RevenuePage() {
  const { transactions, sensitiveData, payees, people } = await getAllData();

  // Build payee -> person mapping
  const payeePersonMap = new Map<string, string>();
  for (const payee of payees) {
    if (payee.personId) payeePersonMap.set(payee.id, payee.personId);
  }

  // Build person name lookup
  const personNames = new Map<string, string>();
  for (const person of people) personNames.set(person.id, person.name);

  const revenueShares = calculateRevenueShares(transactions, sensitiveData, payeePersonMap, personNames);

  // Get current snapshot (last entry with data)
  const currentSnapshot = revenueShares.length > 0 ? revenueShares[revenueShares.length - 1] : null;
  const currentShares = currentSnapshot
    ? Object.entries(currentSnapshot.shares).sort(([, a], [, b]) => b - a)
    : [];

  // Calculate cumulative investments
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Revenue Share</h1>

      <RevenueChart data={revenueShares} />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-semibold">Current Revenue Share Snapshot (Projected to {currentSnapshot?.month})</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Person</th>
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
                  <tr key={name} className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-4 py-2 text-sm font-medium">{name}</td>
                    <td className="px-4 py-2 text-right text-sm font-mono">${historicalInvestment.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-sm font-mono font-bold text-[var(--accent)]">{pct.toFixed(1)}%</td>
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
