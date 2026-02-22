"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ProjectionMonth } from "@/lib/types";

export function ProjectionChart({ data }: { data: ProjectionMonth[] }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <h2 className="mb-4 text-lg font-semibold">Projected Monthly Expenses (USD)</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
            labelStyle={{ color: "var(--text)" }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
          />
          <Legend />
          <Bar dataKey="paid" stackId="1" fill="var(--red)" name="Paid" />
          <Bar dataKey="accrued" stackId="1" fill="var(--orange)" name="Accrued" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
