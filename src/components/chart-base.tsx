"use client";

import type { ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

export const CHART_COLORS = [
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

export function formatMonthLabel(m: string): string {
  const [year, month] = m.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

export const tooltipContentStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
};

export function formatProjName(name: string): string {
  return String(name).endsWith("_proj") ? `${String(name).replace("_proj", "")} (proj)` : String(name);
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
