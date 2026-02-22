"use client";

import { Area, AreaChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenueShare } from "@/lib/types";

const COLORS = [
  "var(--accent)",
  "var(--green)",
  "var(--orange)",
  "var(--pink)",
  "var(--cyan)",
  "var(--purple)",
  "var(--red)",
  "var(--blue)",
  "#a3e635",
  "#fb923c",
  "#38bdf8",
  "#c084fc",
];

function formatMonthLabel(m: string): string {
  const [year, month] = m.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

export function RevenueChart({ data }: { data: RevenueShare[] }) {
  const allNames = new Set<string>();
  for (const entry of data) {
    for (const name of Object.keys(entry.shares)) allNames.add(name);
  }
  const names = [...allNames].sort();

  // Normalize each month so shares sum exactly to 100
  const chartData = data.map((entry) => {
    const total = Object.values(entry.shares).reduce((a, b) => a + b, 0);
    const row: Record<string, string | number> = { month: entry.month };
    for (const name of names) {
      const raw = entry.shares[name] ?? 0;
      row[name] = total > 0 ? Math.round((raw / total) * 1000) / 10 : 0;
    }
    return row;
  });

  const chartWidth = Math.max(900, chartData.length * 16);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <h2 className="mb-4 text-lg font-semibold">Revenue Share Over Time (%)</h2>
      <div className="overflow-x-auto">
        <AreaChart width={chartWidth} height={400} data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickFormatter={formatMonthLabel} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
            labelStyle={{ color: "var(--text)" }}
            labelFormatter={(label) => formatMonthLabel(label)}
            formatter={(value: number) => [`${value.toFixed(1)}%`, undefined]}
          />
          <Legend />
          {names.map((name, i) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stackId="1"
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.7}
              dot={false}
            />
          ))}
        </AreaChart>
      </div>
    </div>
  );
}
