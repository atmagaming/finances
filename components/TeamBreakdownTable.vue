<script setup lang="ts">
interface TableRow {
  personId: string;
  name: string;
  hoursPerWeek: number;
  paidRate: number;
  investedRate: number;
  monthlyPaid: number;
  monthlyAccrued: number;
  monthlyTotal: number;
  currentInvestment: number;
  currentShare: number;
  projectedShare: number;
  isCurrentUser: boolean;
}

const props = defineProps<{
  rows: TableRow[];
  currentPersonId: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  teamCount: number;
}>();

const myRows = computed(() => (props.currentPersonId ? props.rows.filter((r) => r.isCurrentUser) : []));
const otherRows = computed(() => props.rows.filter((r) => !r.isCurrentUser));
const othersCount = computed(() => new Set(otherRows.value.map((r) => r.personId)).size);

function aggregateRows(rowSet: TableRow[]) {
  const totalHours = rowSet.reduce((s, r) => s + r.hoursPerWeek, 0);
  return {
    hoursPerWeek: totalHours,
    paidRate: totalHours > 0 ? rowSet.reduce((s, r) => s + r.hoursPerWeek * r.paidRate, 0) / totalHours : 0,
    investedRate: totalHours > 0 ? rowSet.reduce((s, r) => s + r.hoursPerWeek * r.investedRate, 0) / totalHours : 0,
    monthlyPaid: rowSet.reduce((s, r) => s + r.monthlyPaid, 0),
    monthlyAccrued: rowSet.reduce((s, r) => s + r.monthlyAccrued, 0),
    monthlyTotal: rowSet.reduce((s, r) => s + r.monthlyTotal, 0),
    currentInvestment: rowSet.reduce((s, r) => s + r.currentInvestment, 0),
    currentShare: rowSet.reduce((s, r) => s + r.currentShare, 0),
    projectedShare: rowSet.reduce((s, r) => s + r.projectedShare, 0),
  };
}

const othersAgg = computed(() => aggregateRows(otherRows.value));
const teamAgg = computed(() => aggregateRows(props.rows));

const thClass = "px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] whitespace-nowrap";
</script>

<template>
  <div class="rounded-xl bg-[var(--bg-card)] p-6" style="box-shadow: var(--shadow)">
    <h2 class="mb-4 text-lg font-semibold">Active Team Breakdown</h2>
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-[var(--border)]">
            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Person
            </th>
            <th :class="thClass">Hours/Week</th>
            <th :class="thClass">Paid $/hr</th>
            <th :class="thClass">Invested $/hr</th>
            <th :class="thClass">Monthly Paid</th>
            <th :class="thClass">Monthly Accrued</th>
            <th :class="thClass">Monthly Total</th>
            <th :class="thClass">Current Investment</th>
            <th :class="thClass">Current Share</th>
            <th :class="thClass">Projected Share (Oct 2027)</th>
          </tr>
        </thead>
        <tbody>
          <!-- Admin: show all rows -->
          <template v-if="isAdmin">
            <tr
              v-for="row in rows"
              :key="row.personId"
              class="border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-card-hover)]"
              :style="row.isCurrentUser ? { background: 'var(--accent-light)' } : undefined"
            >
              <td class="px-4 py-3 text-sm font-medium">
                {{ row.isCurrentUser ? `${row.name} (You)` : row.name }}
              </td>
              <td class="px-4 py-3 text-right text-sm font-mono">{{ row.hoursPerWeek }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">${{ Math.round(row.paidRate) }}/hr</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">${{ Math.round(row.investedRate) }}/hr</td>
              <td class="px-4 py-3 text-right text-sm font-mono">${{ row.monthlyPaid.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono">${{ row.monthlyAccrued.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono font-bold">${{ row.monthlyTotal.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono">${{ row.currentInvestment.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono font-bold text-[var(--accent)]">{{ row.currentShare.toFixed(1) }}%</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--accent)]">{{ row.projectedShare.toFixed(1) }}%</td>
            </tr>
          </template>

          <!-- Authenticated non-admin: show own rows + aggregated others -->
          <template v-else-if="isAuthenticated">
            <tr
              v-for="row in myRows"
              :key="row.personId"
              class="border-b border-[var(--border)]"
              style="background: var(--accent-light)"
            >
              <td class="px-4 py-3 text-sm font-medium">{{ row.name }} (You)</td>
              <td class="px-4 py-3 text-right text-sm font-mono">{{ row.hoursPerWeek }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">${{ Math.round(row.paidRate) }}/hr</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">${{ Math.round(row.investedRate) }}/hr</td>
              <td class="px-4 py-3 text-right text-sm font-mono">${{ row.monthlyPaid.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono">${{ row.monthlyAccrued.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono font-bold">${{ row.monthlyTotal.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono">${{ row.currentInvestment.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono font-bold text-[var(--accent)]">{{ row.currentShare.toFixed(1) }}%</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--accent)]">{{ row.projectedShare.toFixed(1) }}%</td>
            </tr>
            <tr
              v-if="otherRows.length > 0"
              class="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors"
            >
              <td class="px-4 py-3 text-sm font-medium text-[var(--text-muted)]">Others ({{ othersCount }})</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--text-muted)]">{{ othersAgg.hoursPerWeek }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">${{ Math.round(othersAgg.paidRate) }}/hr</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">${{ Math.round(othersAgg.investedRate) }}/hr</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--text-muted)]">${{ othersAgg.monthlyPaid.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--text-muted)]">${{ othersAgg.monthlyAccrued.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono font-bold">${{ othersAgg.monthlyTotal.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--text-muted)]">${{ othersAgg.currentInvestment.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono font-bold text-[var(--accent)]">{{ othersAgg.currentShare.toFixed(1) }}%</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--accent)]">{{ othersAgg.projectedShare.toFixed(1) }}%</td>
            </tr>
          </template>

          <!-- Guest: aggregated team -->
          <template v-else>
            <tr class="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors">
              <td class="px-4 py-3 text-sm font-medium">Team ({{ teamCount }})</td>
              <td class="px-4 py-3 text-right text-sm font-mono">{{ teamAgg.hoursPerWeek }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">${{ Math.round(teamAgg.paidRate) }}/hr</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">${{ Math.round(teamAgg.investedRate) }}/hr</td>
              <td class="px-4 py-3 text-right text-sm font-mono">${{ teamAgg.monthlyPaid.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono">${{ teamAgg.monthlyAccrued.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono font-bold">${{ teamAgg.monthlyTotal.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono">${{ teamAgg.currentInvestment.toLocaleString() }}</td>
              <td class="px-4 py-3 text-right text-sm font-mono font-bold text-[var(--accent)]">{{ teamAgg.currentShare.toFixed(1) }}%</td>
              <td class="px-4 py-3 text-right text-sm font-mono text-[var(--accent)]">{{ teamAgg.projectedShare.toFixed(1) }}%</td>
            </tr>
          </template>

          <!-- Total row -->
          <tr
            v-if="isAuthenticated"
            class="border-b border-[var(--border)] border-t-2 border-t-[var(--text-muted)] bg-[var(--bg-card-hover)] font-semibold"
          >
            <td class="px-4 py-3 text-sm font-medium">Total ({{ teamCount }})</td>
            <td class="px-4 py-3 text-right text-sm font-mono">{{ teamAgg.hoursPerWeek }}</td>
            <td class="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">${{ Math.round(teamAgg.paidRate) }}/hr</td>
            <td class="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">${{ Math.round(teamAgg.investedRate) }}/hr</td>
            <td class="px-4 py-3 text-right text-sm font-mono">${{ teamAgg.monthlyPaid.toLocaleString() }}</td>
            <td class="px-4 py-3 text-right text-sm font-mono">${{ teamAgg.monthlyAccrued.toLocaleString() }}</td>
            <td class="px-4 py-3 text-right text-sm font-mono font-bold">${{ teamAgg.monthlyTotal.toLocaleString() }}</td>
            <td class="px-4 py-3 text-right text-sm font-mono">${{ teamAgg.currentInvestment.toLocaleString() }}</td>
            <td class="px-4 py-3 text-right text-sm font-mono font-bold text-[var(--accent)]">{{ teamAgg.currentShare.toFixed(1) }}%</td>
            <td class="px-4 py-3 text-right text-sm font-mono text-[var(--accent)]">{{ teamAgg.projectedShare.toFixed(1) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
