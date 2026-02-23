"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenueShare } from "@/lib/types";
import {
  CHART_COLORS,
  formatMonthLabel,
  formatProjName,
  quarterTicks,
  ResponsiveChart,
  tooltipContentStyle,
} from "./chart-base";

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
    return [...allNames].sort();
  }, [data]);

  const chartData = useMemo(() => buildChartData(data, names), [data, names]);
  const boundaryMonth = [...data].reverse().find((entry) => !entry.isProjected)?.month;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <h2 className="mb-4 text-lg font-semibold">Revenue Share Over Time (%)</h2>
      <ResponsiveChart minWidth={Math.max(900, chartData.length * 16)}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
            stroke="var(--text-muted)"
            fontSize={12}
            tickFormatter={formatMonthLabel}
            ticks={quarterTicks(chartData.map((row) => row.month as string))}
          />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
          <Tooltip
            contentStyle={tooltipContentStyle}
            labelStyle={{ color: "var(--text)" }}
            labelFormatter={(label) => formatMonthLabel(label)}
            formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, formatProjName(name)]}
          />
          <Legend formatter={formatProjName} />

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
                fillOpacity={0.4}
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
                fillOpacity={0.15}
                strokeDasharray="5 4"
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
