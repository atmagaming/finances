import { projectExpenses } from "@/lib/calculations";
import { getCachedSensitiveData } from "@/lib/data";

export default async function ProjectionsPage() {
  const sensitiveData = await getCachedSensitiveData();
  const projections = projectExpenses(sensitiveData, 12);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Expense Projections</h1>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Month
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Paid
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Accrued
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {projections.map((p) => (
              <tr
                key={p.month}
                className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <td className="px-4 py-2 text-sm">{p.month}</td>
                <td className="px-4 py-2 text-right text-sm font-mono text-[var(--red)]">${p.paid.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-sm font-mono text-[var(--orange)]">
                  ${p.accrued.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right text-sm font-mono font-bold">${p.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
