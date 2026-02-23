<script setup lang="ts">
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, MarkLineComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { ChartSeries } from "~/types";

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent]);

const props = withDefaults(
  defineProps<{
    title: string;
    months: string[];
    series: ChartSeries[];
    lastHistMonth: string;
    yAxisFormatter?: (v: number) => string;
    tooltipValueFormatter?: (v: number) => string;
    showTotalLabels?: boolean;
    yAxisMin?: number;
    yAxisMax?: number;
  }>(),
  {
    yAxisFormatter: undefined,
    tooltipValueFormatter: undefined,
    showTotalLabels: false,
    yAxisMin: undefined,
    yAxisMax: undefined,
  },
);

// Resolve CSS variable to actual hex — canvas can't use var()
function resolveCssVar(value: string): string {
  if (!import.meta.client || !value.startsWith("var(")) return value;
  const varName = value.slice(4, -1).trim();
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || value;
}

const chartOption = computed(() => {
  const monthsArr = props.months;
  const seriesArr = props.series;
  if (monthsArr.length === 0 || seriesArr.length === 0) return {};

  const tickSet = quarterTicks(monthsArr);
  const intervalFlags = monthsArr.map((m) => tickSet.includes(m));

  const defaultValueFormatter = (v: number) => `$${v.toLocaleString()}`;
  const tooltipFmt = props.tooltipValueFormatter ?? defaultValueFormatter;
  const yFmt = props.yAxisFormatter ?? defaultValueFormatter;
  const mutedColor = resolveCssVar("var(--text-muted)");

  // Pre-compute total label strings as plain arrays
  let histLabels: string[] = [];
  let projLabels: string[] = [];

  if (props.showTotalLabels) {
    histLabels = monthsArr.map((_, i) => {
      if (seriesArr.every((s) => s.data[i] == null)) return "";
      const sum = seriesArr.reduce((acc, s) => acc + (s.data[i] ?? 0), 0);
      return sum >= 1000 ? `$${Math.round(sum / 1000)}k` : `$${sum}`;
    });
    projLabels = monthsArr.map((_, i) => {
      if (seriesArr.every((s) => s.projData[i] == null)) return "";
      const sum = seriesArr.reduce((acc, s) => acc + (s.projData[i] ?? 0), 0);
      return sum >= 1000 ? `$${Math.round(sum / 1000)}k` : `$${sum}`;
    });
  }

  const echartsSeries: unknown[] = [];
  const legendNames: string[] = [];

  for (const [i, s] of seriesArr.entries()) {
    legendNames.push(s.name);
    const isLast = i === seriesArr.length - 1;
    const resolvedColor = resolveCssVar(s.color);
    const hasLabel = props.showTotalLabels && isLast;

    // Historical series
    const hist: Record<string, unknown> = {
      name: s.name,
      type: "line",
      stack: "hist",
      areaStyle: { opacity: 0.25 },
      data: s.data,
      color: resolvedColor,
      symbol: "circle",
      symbolSize: hasLabel ? 1 : 6,
      showSymbol: hasLabel,
      connectNulls: false,
    };

    if (i === 0 && props.lastHistMonth) {
      hist.markLine = {
        silent: true,
        symbol: "none",
        lineStyle: { type: "dashed", color: mutedColor },
        data: [
          {
            xAxis: props.lastHistMonth,
            label: {
              show: true,
              formatter: () => formatMonthLabel(props.lastHistMonth),
              position: "end",
              fontSize: 11,
              color: mutedColor,
            },
          },
        ],
      };
    }

    if (hasLabel) {
      const labels = histLabels;
      hist.label = {
        show: true,
        position: "top",
        fontSize: 10,
        color: mutedColor,
        formatter: (params: { dataIndex: number }) => labels[params.dataIndex] ?? "",
      };
    }

    echartsSeries.push(hist);

    // Projected series
    const proj: Record<string, unknown> = {
      name: `${s.name} (proj)`,
      type: "line",
      stack: "proj",
      areaStyle: { opacity: 0.1 },
      lineStyle: { type: "dashed" },
      data: s.projData,
      color: resolvedColor,
      showSymbol: hasLabel,
      symbolSize: 1,
      connectNulls: false,
    };

    if (hasLabel) {
      const labels = projLabels;
      proj.label = {
        show: true,
        position: "top",
        fontSize: 10,
        color: mutedColor,
        formatter: (params: { dataIndex: number }) => labels[params.dataIndex] ?? "",
      };
    }

    echartsSeries.push(proj);
  }

  return {
    tooltip: {
      trigger: "axis",
      backgroundColor: resolveCssVar("var(--bg-card)"),
      borderColor: resolveCssVar("var(--border)"),
      textStyle: { fontSize: 12 },
      formatter(params: Array<{ seriesName: string; value: number | null; color: string; axisValueLabel: string }>) {
        const first = params[0];
        if (first == null) return "";
        const label = formatMonthLabel(first.axisValueLabel);
        const seen = new Set<string>();
        const lines = params
          .filter((p) => p.value != null)
          .filter((p) => {
            const base = p.seriesName.replace(" (proj)", "");
            if (seen.has(base)) return false;
            seen.add(base);
            return true;
          })
          .map(
            (p) =>
              `<span style="color:${p.color}">${p.seriesName.replace(" (proj)", "")}: ${tooltipFmt(p.value as number)}</span>`,
          );
        return `<strong>${label}</strong><br/>${lines.join("<br/>")}`;
      },
    },
    legend: { data: legendNames, bottom: 0 },
    grid: { left: 50, right: 30, top: 40, bottom: 50 },
    xAxis: {
      type: "category",
      data: monthsArr,
      axisLabel: {
        formatter: formatMonthLabel,
        interval: (index: number) => intervalFlags[index],
      },
    },
    yAxis: {
      type: "value",
      min: props.yAxisMin,
      max: props.yAxisMax,
      axisLabel: { formatter: yFmt },
    },
    series: echartsSeries,
  };
});
</script>

<template>
  <div class="rounded-xl bg-[var(--bg-card)] p-6" style="box-shadow: var(--shadow)">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold">{{ title }}</h2>
      <slot name="actions" />
    </div>
    <div class="overflow-x-auto">
      <div :style="{ minWidth: `${Math.max(900, months.length * 16)}px` }">
        <VChart :option="chartOption" style="height: 400px" autoresize />
      </div>
    </div>
  </div>
</template>
