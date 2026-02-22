"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyExpense } from "@/lib/types";

export function ExpenseChart({ data }: { data: MonthlyExpense[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <h2 className="mb-4 text-lg font-semibold">Monthly Expenses (USD)</h2>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
            labelStyle={{ color: "var(--text)" }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
          />
          <Legend />
          <Area type="monotone" dataKey="paid" stackId="1" stroke="var(--red)" fill="var(--red)" fillOpacity={0.3} name="Paid" />
          <Area type="monotone" dataKey="accrued" stackId="1" stroke="var(--orange)" fill="var(--orange)" fillOpacity={0.3} name="Accrued" />
          <Area type="monotone" dataKey="invested" stackId="1" stroke="var(--purple)" fill="var(--purple)" fillOpacity={0.3} name="Invested" />
          <Area type="monotone" dataKey="income" stroke="var(--green)" fill="var(--green)" fillOpacity={0.3} name="Income" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
