<script lang="ts">
  import type { ChartSeries, InvestmentPoint } from "$lib/types";
  import { CHART_COLORS } from "$lib/charts";
  import StackedAreaChart from "$lib/components/charts/StackedAreaChart.svelte";
  import Button from "$lib/components/ui/button.svelte";

  export let data: InvestmentPoint[] = [];

  let cumulative = true;

  $: allNames = (() => {
    const s = new Set<string>();
    for (const p of data) for (const n of Object.keys(p.values)) s.add(n);
    const latest = data[data.length - 1]?.values ?? {};
    return [...s].sort((a, b) => (latest[b] ?? 0) - (latest[a] ?? 0));
  })();

  $: lastHistMonth = [...data].reverse().find((t) => !t.isProjected)?.month ?? "";
  $: months = data.map((d) => d.month);

  $: series = allNames.map((name, i) => {
    const dataArr: (number | null)[] = [];
    const projData: (number | null)[] = [];

    let histCum = 0;
    let projCum = 0;

    if (cumulative) {
      for (const point of data) {
        if (point.isProjected) break;
        histCum += point.values[name] ?? 0;
      }
      projCum = histCum;
      histCum = 0;
    }

    for (const point of data) {
      const raw = point.values[name];
      const delta = raw ?? 0;
      if (!point.isProjected) {
        if (cumulative) {
          histCum += delta;
          dataArr.push(histCum);
        } else {
          dataArr.push(raw ?? null);
        }
        projData.push(point.month === lastHistMonth ? dataArr[dataArr.length - 1] ?? null : null);
      } else {
        dataArr.push(null);
        if (cumulative) {
          projCum += delta;
          projData.push(projCum);
        } else {
          projData.push(raw ?? null);
        }
      }
    }

    return {
      name,
      color: CHART_COLORS[i % CHART_COLORS.length] ?? "#6366f1",
      data: dataArr,
      projData,
    } satisfies ChartSeries;
  });
</script>

<StackedAreaChart title="Investments Over Time (USD)" {months} {series} lastHistMonth={lastHistMonth}>
  <svelte:fragment slot="actions">
    <Button variant="outline" size="sm" on:click={() => (cumulative = !cumulative)}>
      Cumulative
    </Button>
  </svelte:fragment>
</StackedAreaChart>
