"use client";

import type { ReactElement } from "react";
import type { TooltipProps } from "recharts";
import { ResponsiveContainer } from "recharts";

export const CHART_COLORS = [
  "#6366f1",
  "#16a34a",
  "#d97706",
  "#db2777",
  "#0891b2",
  "#7c3aed",
  "#dc2626",
  "#2563eb",
  "#65a30d",
  "#ea580c",
  "#0284c7",
  "#a855f7",
];

export function formatMonthLabel(m: string): string {
  const [year, month] = m.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

const QUARTER_MONTHS = new Set(["01", "03", "06", "09"]);

/** Returns tick months: Jan/Mar/Jun/Sep across the range, plus first and last month. */
export function computeChartTicks(months: string[]): string[] {
  if (months.length === 0) return [];
  const ticks = new Set<string>([months[0], months[months.length - 1]]);
  for (const month of months) if (QUARTER_MONTHS.has(month.slice(5, 7))) ticks.add(month);
  return [...ticks].sort();
}

const tooltipContentStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  boxShadow: "var(--shadow-md)",
};

function stripProjSuffix(key: string): string {
  if (key.endsWith("_proj")) return key.slice(0, -5);
  if (key.endsWith("Proj")) return key.slice(0, -4);
  return key;
}

export function chartTooltipContent(formatter: (value: number, name: string) => [string, string]) {
  return ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const withValues = payload.filter((entry) => entry.value != null);
    if (withValues.length === 0) return null;
    // Deduplicate: prefer historical over projected for the same base name
    const seen = new Set<string>();
    const deduped = [];
    for (const entry of withValues) {
      const dataKey = String(entry.dataKey ?? "");
      const baseName = stripProjSuffix(dataKey);
      if (seen.has(baseName)) continue;
      seen.add(baseName);
      deduped.push(entry);
    }
    deduped.reverse();
    return (
      <div style={{ ...tooltipContentStyle, padding: "8px 12px" }}>
        <p style={{ color: "var(--text)", margin: 0, marginBottom: 4, fontSize: 12, fontWeight: 500 }}>
          {formatMonthLabel(label ?? "")}
        </p>
        {deduped.map((entry) => {
          const displayName = stripProjSuffix(String(entry.name));
          const [formattedValue, formattedName] = formatter(entry.value as number, displayName);
          return (
            <p key={String(entry.dataKey)} style={{ color: String(entry.color), margin: 0, fontSize: 12 }}>
              {formattedName}: {formattedValue}
            </p>
          );
        })}
      </div>
    );
  };
}

export function ResponsiveChart({
  children,
  minWidth,
  height = 400,
}: {
  children: ReactElement;
  minWidth: number;
  height?: number;
}) {
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth }}>
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
