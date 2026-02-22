"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

export function RevenueChart({ data }: { data: RevenueShare[] }) {
  // Get all unique person names across all months
  const allNames = new Set<string>();
  for (const entry of data) {
    for (const name of Object.keys(entry.shares)) allNames.add(name);
  }
  const names = [...allNames].sort();

  // Transform to flat records for Recharts
  const chartData = data
    .filter((_, i) => i % 3 === 0 || i === data.length - 1) // Sample every 3 months for readability
    .map((entry) => {
      const row: Record<string, string | number> = { month: entry.month };
      for (const name of names) row[name] = entry.shares[name] ?? 0;
      return row;
    });

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <h2 className="mb-4 text-lg font-semibold">Revenue Share Over Time (%)</h2>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
          <Tooltip
            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
            labelStyle={{ color: "var(--text)" }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, undefined]}
          />
          <Legend />
          {names.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
