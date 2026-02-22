import { getCachedTransactions } from "@/lib/data";
import { aggregateExpensesByMonth } from "@/lib/calculations";
import { ExpenseChart } from "@/components/expense-chart";

export default async function OverviewPage() {
  const transactions = await getCachedTransactions();
  const monthlyExpenses = aggregateExpensesByMonth(transactions);

  // Calculate summary stats
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentYear = `${now.getFullYear()}`;

  const mtd = monthlyExpenses.find((m) => m.month === currentMonth);
  const ytd = monthlyExpenses.filter((m) => m.month.startsWith(currentYear));

  const totalPaidMTD = mtd?.paid ?? 0;
  const totalAccruedMTD = mtd?.accrued ?? 0;
  const totalPaidYTD = ytd.reduce((s, m) => s + m.paid, 0);
  const totalAccruedYTD = ytd.reduce((s, m) => s + m.accrued, 0);
  const totalIncomeYTD = ytd.reduce((s, m) => s + m.income, 0);

  // Average monthly burn (last 3 months)
  const recent = monthlyExpenses.slice(-3);
  const avgBurn = recent.length > 0 ? Math.round(recent.reduce((s, m) => s + m.paid + m.accrued, 0) / recent.length) : 0;

  const cards = [
    { label: "Paid MTD", value: totalPaidMTD, color: "var(--red)" },
    { label: "Accrued MTD", value: totalAccruedMTD, color: "var(--orange)" },
    { label: "Paid YTD", value: totalPaidYTD, color: "var(--red)" },
    { label: "Accrued YTD", value: totalAccruedYTD, color: "var(--orange)" },
    { label: "Income YTD", value: totalIncomeYTD, color: "var(--green)" },
    { label: "Avg Monthly Burn", value: avgBurn, color: "var(--blue)" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Financial Overview</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <p className="text-xs text-[var(--text-muted)]">{card.label}</p>
            <p className="mt-1 text-xl font-bold" style={{ color: card.color }}>
              ${card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      <ExpenseChart data={monthlyExpenses} />
    </div>
  );
}
