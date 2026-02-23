<script setup lang="ts">
import type { ChartSeries, MonthlyExpense, ProjectionMonth } from "~/types";
import { getLastConfirmedMonth, getMonthRange } from "~/server/utils/calculations";

const props = defineProps<{
  historical: MonthlyExpense[];
  projections: ProjectionMonth[];
}>();

const cumulative = ref(true);
const lastConfirmed = getLastConfirmedMonth();

interface MergedPoint {
  month: string;
  paid: number | null;
  accrued: number | null;
  paidProj: number | null;
  accruedProj: number | null;
}

function buildMerged(historical: MonthlyExpense[], projections: ProjectionMonth[], isCumulative: boolean): MergedPoint[] {
  const sorted = [...historical].sort((a, b) => a.month.localeCompare(b.month));
  const confirmed = sorted.filter((h) => h.month <= lastConfirmed);

  const rawMap = new Map<string, { paid: number; accrued: number }>();
  for (const h of confirmed) rawMap.set(h.month, { paid: h.paid, accrued: h.accrued });

  let paidCum = 0;
  let accruedCum = 0;
  const histMap = new Map<string, { paid: number; accrued: number }>();
  const firstConfirmed = confirmed[0];
  if (firstConfirmed) {
    for (const month of getMonthRange(firstConfirmed.month, lastConfirmed)) {
      const data = rawMap.get(month);
      if (isCumulative) {
        paidCum += data?.paid ?? 0;
        accruedCum += data?.accrued ?? 0;
      } else {
        paidCum = data?.paid ?? 0;
        accruedCum = data?.accrued ?? 0;
      }
      histMap.set(month, { paid: paidCum, accrued: accruedCum });
    }
  }

  const basePaid = isCumulative ? paidCum : 0;
  const baseAccrued = isCumulative ? accruedCum : 0;
  let projPaidCum = basePaid;
  let projAccruedCum = baseAccrued;
  const projMap = new Map<string, { paid: number; accrued: number }>();
  const sortedProj = [...projections].sort((a, b) => a.month.localeCompare(b.month));
  for (const p of sortedProj) {
    if (isCumulative) {
      projPaidCum += p.paid;
      projAccruedCum += p.accrued;
    } else {
      projPaidCum = p.paid;
      projAccruedCum = p.accrued;
    }
    projMap.set(p.month, { paid: projPaidCum, accrued: projAccruedCum });
  }

  const allKeys = [...histMap.keys(), ...projMap.keys()].sort();
  const firstMonth = allKeys[0];
  const lastMonth = allKeys[allKeys.length - 1];
  const allMonths = firstMonth && lastMonth ? getMonthRange(firstMonth, lastMonth) : [];

  return allMonths.map((month) => {
    const h = histMap.get(month) ?? null;
    const p = projMap.get(month) ?? null;
    const isBoundary = month === lastConfirmed;

    return {
      month,
      paid: h?.paid ?? null,
      accrued: h?.accrued ?? null,
      paidProj: p?.paid ?? (isBoundary && h ? h.paid : null),
      accruedProj: p?.accrued ?? (isBoundary && h ? h.accrued : null),
    };
  });
}

const merged = computed(() => buildMerged(props.historical, props.projections, cumulative.value));
const months = computed(() => merged.value.map((d) => d.month));

const series = computed<ChartSeries[]>(() => [
  {
    name: "Paid",
    color: "#dc2626",
    data: merged.value.map((d) => d.paid),
    projData: merged.value.map((d) => d.paidProj),
  },
  {
    name: "Accrued",
    color: "#d97706",
    data: merged.value.map((d) => d.accrued),
    projData: merged.value.map((d) => d.accruedProj),
  },
]);
</script>

<template>
  <StackedAreaChart
    title="Expenses (USD)"
    :months="months"
    :series="series"
    :last-hist-month="lastConfirmed"
    :show-total-labels="true"
  >
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
