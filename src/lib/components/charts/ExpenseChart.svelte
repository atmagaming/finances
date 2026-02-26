<script lang="ts">
  import type { ChartSeries, MonthlyExpense, ProjectionMonth } from "$lib/types";
  import { getLastConfirmedMonth, getMonthRange } from "$lib/date";
  import StackedAreaChart from "$lib/components/charts/StackedAreaChart.svelte";
  import Button from "$lib/components/ui/button.svelte";

  export let historical: MonthlyExpense[] = [];
  export let projections: ProjectionMonth[] = [];

  let cumulative = true;
  const lastConfirmed = getLastConfirmedMonth();

  interface MergedPoint {
    month: string;
    paid: number | null;
    accrued: number | null;
    paidProj: number | null;
    accruedProj: number | null;
  }

  function buildMerged(
    historicalInput: MonthlyExpense[],
    projectionsInput: ProjectionMonth[],
    isCumulative: boolean,
  ): MergedPoint[] {
    const sorted = [...historicalInput].sort((a, b) => a.month.localeCompare(b.month));
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
    const sortedProj = [...projectionsInput].sort((a, b) => a.month.localeCompare(b.month));
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

  $: merged = buildMerged(historical, projections, cumulative);
  $: months = merged.map((d) => d.month);

  $: series = [
    {
      name: "Paid",
      color: "#dc2626",
      data: merged.map((d) => d.paid),
      projData: merged.map((d) => d.paidProj),
    },
    {
      name: "Accrued",
      color: "#d97706",
      data: merged.map((d) => d.accrued),
      projData: merged.map((d) => d.accruedProj),
    },
  ] as ChartSeries[];
</script>

<StackedAreaChart
  title="Expenses (USD)"
  {months}
  {series}
  lastHistMonth={lastConfirmed}
  showTotalLabels={true}
>
  <svelte:fragment slot="actions">
    <Button variant="outline" size="sm" on:click={() => (cumulative = !cumulative)}>
      Cumulative
    </Button>
  </svelte:fragment>
</StackedAreaChart>
