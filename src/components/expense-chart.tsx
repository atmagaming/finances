"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { getLastConfirmedMonth } from "@/lib/calculations";
import type { MonthlyExpense, ProjectionMonth } from "@/lib/types";
import { formatMonthLabel, quarterTicks, ResponsiveChart, tooltipContentStyle } from "./chart-base";

interface MergedPoint {
  month: string;
  paid: number | null;
  accrued: number | null;
  total: number | null;
  paidProj: number | null;
  accruedProj: number | null;
  totalProj: number | null;
}

function buildMerged(
  historical: MonthlyExpense[],
  projections: ProjectionMonth[],
  cumulative: boolean,
  lastConfirmed: string,
): MergedPoint[] {
  const sorted = [...historical].sort((a, b) => a.month.localeCompare(b.month));
  const confirmed = sorted.filter((h) => h.month <= lastConfirmed);

  let paidCum = 0,
    accruedCum = 0;
  const histMap = new Map<string, { paid: number; accrued: number }>();
  for (const h of confirmed) {
    if (cumulative) {
      paidCum += h.paid;
      accruedCum += h.accrued;
    } else {
      paidCum = h.paid;
      accruedCum = h.accrued;
    }
    histMap.set(h.month, { paid: paidCum, accrued: accruedCum });
  }

  const basePaid = cumulative ? paidCum : 0;
  const baseAccrued = cumulative ? accruedCum : 0;
  let projPaidCum = basePaid,
    projAccruedCum = baseAccrued;
  const projMap = new Map<string, { paid: number; accrued: number }>();
  const sortedProj = [...projections].sort((a, b) => a.month.localeCompare(b.month));
  for (const p of sortedProj) {
    if (cumulative) {
      projPaidCum += p.paid;
      projAccruedCum += p.accrued;
    } else {
      projPaidCum = p.paid;
      projAccruedCum = p.accrued;
    }
    projMap.set(p.month, { paid: projPaidCum, accrued: projAccruedCum });
  }

  const allMonths = [...new Set([...histMap.keys(), ...projMap.keys()])].sort();

  return allMonths.map((month) => {
    const h = histMap.get(month) ?? null;
    const p = projMap.get(month) ?? null;
    const isBoundary = month === lastConfirmed;

    return {
      month,
      paid: h?.paid ?? null,
      accrued: h?.accrued ?? null,
      total: h ? h.paid + h.accrued : null,
      paidProj: p?.paid ?? (isBoundary && h ? h.paid : null),
      accruedProj: p?.accrued ?? (isBoundary && h ? h.accrued : null),
      totalProj: p ? p.paid + p.accrued : isBoundary && h ? h.paid + h.accrued : null,
    };
  });
}

function fmtValue(v: number): string {
  return v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`;
}

function StackLabel({
  x,
  y,
  index,
  data,
  field,
}: {
  x?: number;
  y?: number;
  index?: number;
  data: MergedPoint[];
  field: "total" | "totalProj";
}) {
  if (x === undefined || y === undefined || index === undefined) return null;
  const v = data[index]?.[field];
  if (v == null) return null;
  return (
    <text x={x} y={y - 6} fill="var(--text-muted)" fontSize={10} textAnchor="middle">
      {fmtValue(v)}
    </text>
  );
}

export function ExpenseChart({
  historical,
  projections,
}: {
  historical: MonthlyExpense[];
  projections: ProjectionMonth[];
}) {
  const [cumulative, setCumulative] = useState(true);
  const lastConfirmed = getLastConfirmedMonth();

  const data = useMemo(
    () => buildMerged(historical, projections, cumulative, lastConfirmed),
    [historical, projections, cumulative, lastConfirmed],
  );

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Monthly Expenses (USD)</h2>
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

      <ResponsiveChart minWidth={Math.max(900, data.length * 80)}>
        <AreaChart data={data} margin={{ top: 24, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
            stroke="var(--text-muted)"
            fontSize={12}
            tickFormatter={formatMonthLabel}
            ticks={quarterTicks(data.map((row) => row.month))}
          />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={tooltipContentStyle}
            labelStyle={{ color: "var(--text)" }}
            labelFormatter={(label: string) => formatMonthLabel(label)}
            formatter={(value: number, name: string) => {
              const label = name.replace(" (proj)", " (projected)");
              return [`$${value.toLocaleString()}`, label];
            }}
          />
          <Legend />

          {/* Historical — solid */}
          <Area
            type="monotone"
            dataKey="paid"
            stackId="hist"
            stroke="var(--red)"
            fill="var(--red)"
            fillOpacity={0.35}
            name="Paid"
            connectNulls={false}
            dot={{ r: 3, fill: "var(--red)", strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="accrued"
            stackId="hist"
            stroke="var(--orange)"
            fill="var(--orange)"
            fillOpacity={0.35}
            name="Accrued"
            connectNulls={false}
            dot={{ r: 3, fill: "var(--orange)", strokeWidth: 0 }}
            label={(props: Record<string, unknown>) => (
              <StackLabel
                x={props.x as number}
                y={props.y as number}
                index={props.index as number}
                data={data}
                field="total"
              />
            )}
          />

          {/* Projected — dashed, lower opacity */}
          <Area
            type="monotone"
            dataKey="paidProj"
            stackId="proj"
            stroke="var(--red)"
            fill="var(--red)"
            fillOpacity={0.12}
            strokeDasharray="5 4"
            name="Paid (proj)"
            connectNulls={false}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="accruedProj"
            stackId="proj"
            stroke="var(--orange)"
            fill="var(--orange)"
            fillOpacity={0.12}
            strokeDasharray="5 4"
            name="Accrued (proj)"
            connectNulls={false}
            dot={false}
            label={(props: Record<string, unknown>) => (
              <StackLabel
                x={props.x as number}
                y={props.y as number}
                index={props.index as number}
                data={data}
                field="totalProj"
              />
            )}
          />

          <ReferenceLine
            x={lastConfirmed}
            stroke="var(--text-muted)"
            strokeDasharray="4 3"
            label={{ value: "Today", position: "insideTopRight", fill: "var(--text-muted)", fontSize: 11 }}
          />
        </AreaChart>
      </ResponsiveChart>
    </div>
  );
}
