<script setup lang="ts">
import type { ChartSeries, RevenueShare } from "~/types";

const props = defineProps<{
  data: RevenueShare[];
}>();

const names = computed(() => {
  const allNames = new Set<string>();
  for (const entry of props.data) for (const name of Object.keys(entry.shares)) allNames.add(name);
  const latest = props.data[props.data.length - 1]?.shares ?? {};
  return [...allNames].sort((a, b) => (latest[b] ?? 0) - (latest[a] ?? 0));
});

const lastHistMonth = computed(() => [...props.data].reverse().find((e) => !e.isProjected)?.month ?? "");

const months = computed(() => props.data.map((d) => d.month));

const series = computed<ChartSeries[]>(() =>
  names.value.map((name, i) => {
    const data: (number | null)[] = [];
    const projData: (number | null)[] = [];

    for (const entry of props.data) {
      const total = Object.values(entry.shares).reduce((a, b) => a + b, 0);
      const pct = total > 0 ? Math.round(((entry.shares[name] ?? 0) / total) * 1000) / 10 : 0;

      if (!entry.isProjected) {
        data.push(pct);
        projData.push(entry.month === lastHistMonth.value ? pct : null);
      } else {
        data.push(null);
        projData.push(pct);
      }
    }

    return {
      name,
      color: CHART_COLORS[i % CHART_COLORS.length] ?? CHART_COLORS[0] ?? "#6366f1",
      data,
      projData,
    };
  }),
);

const yAxisFormatter = (v: number) => `${v}%`;
const tooltipValueFormatter = (v: number) => `${v.toFixed(1)}%`;
</script>

<template>
  <StackedAreaChart
    title="Revenue Share Over Time (%)"
    :months="months"
    :series="series"
    :last-hist-month="lastHistMonth"
    :y-axis-formatter="yAxisFormatter"
    :tooltip-value-formatter="tooltipValueFormatter"
    :y-axis-min="0"
    :y-axis-max="100"
  />
</template>
