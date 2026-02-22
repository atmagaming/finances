"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyExpense, ProjectionMonth } from "@/lib/types";

interface MergedPoint {
  month: string;
  // Historical (solid areas)
  paid: number | null;
  accrued: number | null;
  total: number | null;
  // Projected (dashed areas)
  paidProj: number | null;
  accruedProj: number | null;
  totalProj: number | null;
}

function buildMerged(historical: MonthlyExpense[], projections: ProjectionMonth[], cumulative: boolean): MergedPoint[] {
  const sorted = [...historical].sort((a, b) => a.month.localeCompare(b.month));
  const lastHistMonth = sorted.at(-1)?.month ?? "";

  // Cumulative historical
  let paidCum = 0,
    accruedCum = 0;
  const histMap = new Map<string, { paid: number; accrued: number }>();
  for (const h of sorted) {
    if (cumulative) {
      paidCum += h.paid;
      accruedCum += h.accrued;
    } else {
      paidCum = h.paid;
      accruedCum = h.accrued;
    }
    histMap.set(h.month, { paid: paidCum, accrued: accruedCum });
  }

  // Cumulative projected — continues from last historical cumulative
  const basePaid = cumulative ? paidCum : 0;
  const baseAccrued = cumulative ? accruedCum : 0;
  let projPaidCum = basePaid,
    projAccruedCum = baseAccrued;
  const projMap = new Map<string, { paid: number; accrued: number }>();
  const sortedProj = [...projections].sort((a, b) => a.month.localeCompare(b.month));
  for (const p of sortedProj) {
    // Skip months already in historical
    if (histMap.has(p.month)) continue;
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
    const isLastHist = month === lastHistMonth;

    return {
      month,
      paid: h?.paid ?? null,
      accrued: h?.accrued ?? null,
      total: h ? h.paid + h.accrued : null,
      // Projected series starts at the last historical point for a visual connection
      paidProj: p?.paid ?? (isLastHist && h ? h.paid : null),
      accruedProj: p?.accrued ?? (isLastHist && h ? h.accrued : null),
      totalProj: p ? p.paid + p.accrued : isLastHist && h ? h.paid + h.accrued : null,
    };
  });
}

function formatMonthLabel(m: string): string {
  const [year, month] = m.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
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

  const data = useMemo(() => buildMerged(historical, projections, cumulative), [historical, projections, cumulative]);

  // Width: 80px per data point, min 900
  const chartWidth = Math.max(900, data.length * 80);

  // Find the boundary month label for the reference line
  const boundaryMonth = [...historical].sort((a, b) => a.month.localeCompare(b.month)).at(-1)?.month;

  const tooltipStyle = {
    contentStyle: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 },
    labelStyle: { color: "var(--text)" },
    labelFormatter: (label: string) => formatMonthLabel(label),
    formatter: (value: number, name: string) => {
      const label = name.replace(" (proj)", " (projected)");
      return [`$${value.toLocaleString()}`, label];
    },
  };

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

      <div className="overflow-x-auto">
        <AreaChart width={chartWidth} height={400} data={data} margin={{ top: 24, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickFormatter={formatMonthLabel} />
          <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `$${v}`} />
          <Tooltip {...tooltipStyle} />
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

          {/* Vertical marker at current month boundary */}
          {boundaryMonth && (
            <ReferenceLine
              x={boundaryMonth}
              stroke="var(--text-muted)"
              strokeDasharray="4 3"
              label={{ value: "Today", position: "insideTopRight", fill: "var(--text-muted)", fontSize: 11 }}
            />
          )}
        </AreaChart>
      </div>
    </div>
  );
}
