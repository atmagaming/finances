"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenueShare } from "@/lib/types";
import { CHART_COLORS, chartTooltipContent, formatMonthLabel, quarterTicks, ResponsiveChart } from "./chart-base";

type ChartRow = Record<string, string | number | null>;

function buildChartData(data: RevenueShare[], names: string[]): ChartRow[] {
  const lastHistMonth = [...data].reverse().find((entry) => !entry.isProjected)?.month ?? "";

  return data.map((entry) => {
    const total = Object.values(entry.shares).reduce((a, b) => a + b, 0);
    const row: ChartRow = { month: entry.month };

    for (const name of names) {
      const raw = entry.shares[name] ?? 0;
      const pct = total > 0 ? Math.round((raw / total) * 1000) / 10 : 0;

      if (!entry.isProjected) {
        row[name] = pct;
        row[`${name}_proj`] = null;
        if (entry.month === lastHistMonth) row[`${name}_proj`] = pct;
      } else {
        row[name] = null;
        row[`${name}_proj`] = pct;
      }
    }

    return row;
  });
}

export function RevenueChart({ data }: { data: RevenueShare[] }) {
  const names = useMemo(() => {
    const allNames = new Set<string>();
    for (const entry of data) for (const name of Object.keys(entry.shares)) allNames.add(name);
    // Sort by latest share descending so largest is at the bottom of the stack
    const latest = data.length > 0 ? data[data.length - 1].shares : {};
    return [...allNames].sort((a, b) => (latest[b] ?? 0) - (latest[a] ?? 0));
  }, [data]);

  const chartData = useMemo(() => buildChartData(data, names), [data, names]);
  const ticks = useMemo(() => quarterTicks(chartData.map((d) => d.month as string)), [chartData]);
  const boundaryMonth = [...data].reverse().find((entry) => !entry.isProjected)?.month;

  return (
    <div className="rounded-xl bg-[var(--bg-card)] p-6" style={{ boxShadow: "var(--shadow)" }}>
      <h2 className="mb-4 text-lg font-semibold">Revenue Share Over Time (%)</h2>
      <ResponsiveChart minWidth={Math.max(900, chartData.length * 16)}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
            ticks={ticks}
            stroke="var(--text-muted)"
            fontSize={12}
            tickFormatter={formatMonthLabel}
          />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
          <Tooltip content={chartTooltipContent((value, name) => [`${value.toFixed(1)}%`, name])} />
          <Legend />

          {names.map((name, i) => {
            const color = CHART_COLORS[i % CHART_COLORS.length];
            return [
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stackId="hist"
                stroke={color}
                fill={color}
                fillOpacity={0.25}
                connectNulls={false}
                dot={false}
              />,
              <Area
                key={`${name}_proj`}
                type="monotone"
                dataKey={`${name}_proj`}
                stackId="proj"
                stroke={color}
                fill={color}
                fillOpacity={0.1}
                strokeDasharray="5 4"
                legendType="none"
                connectNulls={false}
                dot={false}
              />,
            ];
          })}

          {boundaryMonth && (
            <ReferenceLine
              x={boundaryMonth}
              stroke="var(--text-muted)"
              strokeDasharray="4 3"
              label={{ value: "Today", position: "insideTopRight", fill: "var(--text-muted)", fontSize: 11 }}
            />
          )}
        </AreaChart>
      </ResponsiveChart>
    </div>
  );
}
