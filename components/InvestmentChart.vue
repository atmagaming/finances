<script setup lang="ts">
import type { ChartSeries, InvestmentPoint } from "~/types";

const props = defineProps<{
  data: InvestmentPoint[];
}>();

const cumulative = ref(true);

const allNames = computed(() => {
  const s = new Set<string>();
  for (const p of props.data) for (const n of Object.keys(p.values)) s.add(n);
  const latest = props.data[props.data.length - 1]?.values ?? {};
  return [...s].sort((a, b) => (latest[b] ?? 0) - (latest[a] ?? 0));
});

const lastHistMonth = computed(() => [...props.data].reverse().find((t) => !t.isProjected)?.month ?? "");

const months = computed(() => props.data.map((d) => d.month));

const series = computed<ChartSeries[]>(() => {
  const names = allNames.value;
  const isCumulative = cumulative.value;
  const lastHist = lastHistMonth.value;

  return names.map((name, i) => {
    const data: (number | null)[] = [];
    const projData: (number | null)[] = [];

    let histCum = 0;
    let projCum = 0;

    if (isCumulative) {
      for (const point of props.data) {
        if (point.isProjected) break;
        histCum += point.values[name] ?? 0;
      }
      projCum = histCum;
      histCum = 0;
    }

    for (const point of props.data) {
      const delta = point.values[name] ?? 0;
      if (!point.isProjected) {
        if (isCumulative) {
          histCum += delta;
          data.push(histCum);
        } else {
          data.push(delta || null);
        }
        projData.push(point.month === lastHist ? data[data.length - 1] ?? null : null);
      } else {
        data.push(null);
        if (isCumulative) {
          projCum += delta;
          projData.push(projCum);
        } else {
          projData.push(delta || null);
        }
      }
    }

    return {
      name,
      color: CHART_COLORS[i % CHART_COLORS.length] ?? "#6366f1",
      data,
      projData,
    };
  });
});
</script>

<template>
  <StackedAreaChart title="Investments Over Time (USD)" :months="months" :series="series" :last-hist-month="lastHistMonth">
    <template #actions>
      <button
        type="button"
        class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        :style="{
          background: cumulative ? 'var(--blue)' : 'transparent',
          color: cumulative ? '#fff' : 'var(--text-muted)',
          borderColor: cumulative ? 'var(--blue)' : 'var(--border)',
        }"
        @click="cumulative = !cumulative"
      >
        Cumulative
      </button>
    </template>
  </StackedAreaChart>
</template>
