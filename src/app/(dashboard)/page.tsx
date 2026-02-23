import { auth } from "@/auth";
import { ExpenseChart } from "@/components/expense-chart";
import { NoSSR } from "@/components/no-ssr";
import { aggregateExpensesByMonth, projectExpenses } from "@/lib/calculations";
import { getCachedPeople, getCachedSensitiveData, getCachedTransactions } from "@/lib/data";

export default async function OverviewPage() {
  const session = await auth();
  const currentPersonId = session?.user?.personId ?? null;
  const isAuthenticated = !!session;

  const [transactions, sensitiveData, people] = await Promise.all([
    getCachedTransactions(),
    getCachedSensitiveData(),
    getCachedPeople(),
  ]);

  const monthlyExpenses = aggregateExpensesByMonth(transactions);
  const projections = projectExpenses(sensitiveData, 18);

  const n = monthlyExpenses.length;
  const avgPaid = n > 0 ? Math.round(monthlyExpenses.reduce((s, m) => s + m.paid, 0) / n) : 0;
  const avgAccrued = n > 0 ? Math.round(monthlyExpenses.reduce((s, m) => s + m.accrued, 0) / n) : 0;
  const avgTotal = avgPaid + avgAccrued;

  const cards = [
    { label: "Avg Monthly Paid", value: avgPaid, color: "var(--red)" },
    { label: "Avg Monthly Accrued", value: avgAccrued, color: "var(--orange)" },
    { label: "Avg Monthly Total", value: avgTotal, color: "var(--blue)" },
  ];

  const activeSd = sensitiveData.filter((sd) => sd.status === "Active");

  // Team breakdown data
  const teamCount = new Set(activeSd.map((sd) => sd.personId)).size;
  const teamHours = activeSd.reduce((s, sd) => s + sd.hoursPerWeek, 0);
  const teamWeeklyCost = activeSd.reduce((s, sd) => s + sd.hoursPerWeek * (sd.hourlyPaid + sd.hourlyInvested), 0);

  // Per-person breakdown (only for authenticated users)
  const mySd = currentPersonId ? activeSd.filter((sd) => sd.personId === currentPersonId) : [];
  const othersSd = activeSd.filter((sd) => sd.personId !== currentPersonId);
  const othersCount = new Set(othersSd.map((sd) => sd.personId)).size;
  const othersHours = othersSd.reduce((s, sd) => s + sd.hoursPerWeek, 0);
  const othersWeeklyCost = othersSd.reduce((s, sd) => s + sd.hoursPerWeek * (sd.hourlyPaid + sd.hourlyInvested), 0);
  const myName = currentPersonId ? (people.find((p) => p.id === currentPersonId)?.name ?? "") : "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financial Overview</h1>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-muted)]">{card.label}</p>
            <p className="mt-1 text-xl font-bold" style={{ color: card.color }}>
              ${card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <NoSSR>
        <ExpenseChart historical={monthlyExpenses} projections={projections} />
      </NoSSR>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="mb-4 text-lg font-semibold">Active Team Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Person
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Hours/Week
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Paid Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Accrued Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  Weekly Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {isAuthenticated ? (
                <>
                  {mySd.map((sd) => (
                    <tr
                      key={sd.id}
                      className="border-b border-[var(--border)] transition-colors"
                      style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)" }}
                    >
                      <td className="px-4 py-2 text-sm font-medium">
                        {myName} <span className="text-[var(--accent)]">(You)</span>
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono">{sd.hoursPerWeek}</td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-[var(--red)]">${sd.hourlyPaid}/hr</td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-[var(--orange)]">
                        ${sd.hourlyInvested}/hr
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-mono font-bold">
                        ${(sd.hoursPerWeek * (sd.hourlyPaid + sd.hourlyInvested)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {othersSd.length > 0 && (
                    <tr className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="px-4 py-2 text-sm text-[var(--text-muted)]">Others ({othersCount})</td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-[var(--text-muted)]">{othersHours}</td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-[var(--text-muted)]">—</td>
                      <td className="px-4 py-2 text-right text-sm font-mono text-[var(--text-muted)]">—</td>
                      <td className="px-4 py-2 text-right text-sm font-mono font-bold text-[var(--text-muted)]">
                        ${othersWeeklyCost.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="px-4 py-2 text-sm font-medium">Team ({teamCount})</td>
                  <td className="px-4 py-2 text-right text-sm font-mono">{teamHours}</td>
                  <td className="px-4 py-2 text-right text-sm font-mono text-[var(--text-muted)]">—</td>
                  <td className="px-4 py-2 text-right text-sm font-mono text-[var(--text-muted)]">—</td>
                  <td className="px-4 py-2 text-right text-sm font-mono font-bold">
                    ${teamWeeklyCost.toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
