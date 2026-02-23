"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { InvestmentPoint } from "@/lib/types";
import { CHART_COLORS, chartTooltipContent, computeChartTicks, formatMonthLabel, ResponsiveChart } from "./chart-base";

type ChartRow = Record<string, string | number | null>;

function buildChartData(timeline: InvestmentPoint[], names: string[], cumulative: boolean): ChartRow[] {
  const lastHistMonth = [...timeline].reverse().find((t) => !t.isProjected)?.month ?? "";

  const histCum: Record<string, number> = {};
  const projCum: Record<string, number> = {};

  if (cumulative) {
    for (const point of timeline) {
      if (point.isProjected) break;
      for (const name of names) histCum[name] = (histCum[name] ?? 0) + (point.values[name] ?? 0);
    }
    for (const name of names) projCum[name] = histCum[name] ?? 0;
    for (const name of names) histCum[name] = 0;
  }

  return timeline.map((point) => {
    const row: ChartRow = { month: point.month };

    for (const name of names) {
      const delta = point.values[name] ?? 0;

      if (!point.isProjected) {
        if (cumulative) {
          histCum[name] = (histCum[name] ?? 0) + delta;
          row[name] = histCum[name];
        } else {
          row[name] = delta || null;
        }
        row[`${name}_proj`] = null;
        if (point.month === lastHistMonth) row[`${name}_proj`] = row[name];
      } else {
        row[name] = null;
        if (cumulative) {
          projCum[name] = (projCum[name] ?? 0) + delta;
          row[`${name}_proj`] = projCum[name];
        } else {
          row[`${name}_proj`] = delta || null;
        }
      }
    }

    return row;
  });
}

export function InvestmentChart({ data }: { data: InvestmentPoint[] }) {
  const [cumulative, setCumulative] = useState(true);

  const allNames = useMemo(() => {
    const s = new Set<string>();
    for (const p of data) for (const n of Object.keys(p.values)) s.add(n);
    const latest = data.length > 0 ? data[data.length - 1].values : {};
    return [...s].sort((a, b) => (latest[b] ?? 0) - (latest[a] ?? 0));
  }, [data]);

  const chartData = useMemo(() => buildChartData(data, allNames, cumulative), [data, allNames, cumulative]);
  const ticks = useMemo(() => computeChartTicks(chartData.map((d) => d.month as string)), [chartData]);
  const boundaryMonth = [...data].reverse().find((t) => !t.isProjected)?.month;

  return (
    <div className="rounded-xl bg-[var(--bg-card)] p-6" style={{ boxShadow: "var(--shadow)" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Investments Over Time (USD)</h2>
        <button
          type="button"
          onClick={() => setCumulative((v) => !v)}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            background: cumulative ? "var(--blue)" : "transparent",
            color: cumulative ? "#fff" : "var(--text-muted)",
            borderColor: cumulative ? "var(--blue)" : "var(--border)",
          }}
        >
          Cumulative
        </button>
      </div>
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
          <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `$${v}`} />
          <Tooltip content={chartTooltipContent((value, name) => [`$${value.toLocaleString()}`, name])} />
          <Legend />

          {allNames.map((name, i) => {
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
