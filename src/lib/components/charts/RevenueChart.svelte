<script lang="ts">
  import type { ChartSeries, RevenueShare } from "$lib/types";
  import { CHART_COLORS } from "$lib/charts";
  import StackedAreaChart from "$lib/components/charts/StackedAreaChart.svelte";

  export let data: RevenueShare[] = [];

  $: names = (() => {
    const allNames = new Set<string>();
    for (const entry of data) for (const name of Object.keys(entry.shares)) allNames.add(name);
    const latest = data[data.length - 1]?.shares ?? {};
    return [...allNames].sort((a, b) => (latest[b] ?? 0) - (latest[a] ?? 0));
  })();

  $: lastHistMonth = [...data].reverse().find((e) => !e.isProjected)?.month ?? "";
  $: months = data.map((d) => d.month);

  $: series = names.map((name, i) => {
    const dataArr: (number | null)[] = [];
    const projData: (number | null)[] = [];

    for (const entry of data) {
      const total = Object.values(entry.shares).reduce((a, b) => a + b, 0);
      const pct = total > 0 ? Math.round(((entry.shares[name] ?? 0) / total) * 1000) / 10 : 0;

      if (!entry.isProjected) {
        dataArr.push(pct);
        projData.push(entry.month === lastHistMonth ? pct : null);
      } else {
        dataArr.push(null);
        projData.push(pct);
      }
    }

    return {
      name,
      color: CHART_COLORS[i % CHART_COLORS.length] ?? CHART_COLORS[0] ?? "#6366f1",
      data: dataArr,
      projData,
    } satisfies ChartSeries;
  });

  const yAxisFormatter = (v: number) => `${v}%`;
  const tooltipValueFormatter = (v: number) => `${v.toFixed(1)}%`;
</script>

<StackedAreaChart
  title="Revenue Share Over Time (%)"
  {months}
  {series}
  lastHistMonth={lastHistMonth}
  yAxisFormatter={yAxisFormatter}
  tooltipValueFormatter={tooltipValueFormatter}
  yAxisMin={0}
  yAxisMax={100}
/>
