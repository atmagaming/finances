<script lang="ts">
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table/index.js";

  interface TableRowData {
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

  export let rows: TableRowData[] = [];
  export let currentPersonId: string | null = null;
  export let isAdmin = false;
  export let isAuthenticated = false;
  export let teamCount = 0;

  $: myRows = currentPersonId ? rows.filter((r) => r.isCurrentUser) : [];
  $: otherRows = rows.filter((r) => !r.isCurrentUser);
  $: othersCount = new Set(otherRows.map((r) => r.personId)).size;

  function aggregateRows(rowSet: TableRowData[]) {
    const totalHours = rowSet.reduce((s, r) => s + r.hoursPerWeek, 0);
    return {
      hoursPerWeek: totalHours,
      paidRate: totalHours > 0 ? rowSet.reduce((s, r) => s + r.hoursPerWeek * r.paidRate, 0) / totalHours : 0,
      investedRate:
        totalHours > 0 ? rowSet.reduce((s, r) => s + r.hoursPerWeek * r.investedRate, 0) / totalHours : 0,
      monthlyPaid: rowSet.reduce((s, r) => s + r.monthlyPaid, 0),
      monthlyAccrued: rowSet.reduce((s, r) => s + r.monthlyAccrued, 0),
      monthlyTotal: rowSet.reduce((s, r) => s + r.monthlyTotal, 0),
      currentInvestment: rowSet.reduce((s, r) => s + r.currentInvestment, 0),
      currentShare: rowSet.reduce((s, r) => s + r.currentShare, 0),
      projectedShare: rowSet.reduce((s, r) => s + r.projectedShare, 0),
    };
  }

  $: othersAgg = aggregateRows(otherRows);
  $: teamAgg = aggregateRows(rows);
</script>

<div class="rounded-xl border border-border bg-card shadow-sm">
  <div class="border-b border-border px-6 py-4">
    <h2 class="text-base font-semibold text-foreground">Active Team Breakdown</h2>
  </div>
  <Table>
    <TableHeader>
      <TableRow class="border-b border-border hover:bg-transparent">
        <TableHead class="px-4 py-3 text-left">Person</TableHead>
        <TableHead class="px-4 py-3 text-right">Hours/Week</TableHead>
        <TableHead class="px-4 py-3 text-right">Paid $/hr</TableHead>
        <TableHead class="px-4 py-3 text-right">Invested $/hr</TableHead>
        <TableHead class="px-4 py-3 text-right">Monthly Paid</TableHead>
        <TableHead class="px-4 py-3 text-right">Monthly Accrued</TableHead>
        <TableHead class="px-4 py-3 text-right">Monthly Total</TableHead>
        <TableHead class="px-4 py-3 text-right">Current Investment</TableHead>
        <TableHead class="px-4 py-3 text-right">Current Share</TableHead>
        <TableHead class="px-4 py-3 text-right">Projected Share (Oct 2027)</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#if isAdmin}
        {#each rows as row (row.personId)}
          <TableRow class={row.isCurrentUser ? "bg-primary/5" : ""}>
            <TableCell class="px-4 py-3 text-sm font-medium">
              {row.isCurrentUser ? `${row.name} (You)` : row.name}
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono">{row.hoursPerWeek}</TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">
              ${Math.round(row.paidRate)}/hr
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">
              ${Math.round(row.investedRate)}/hr
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono">${row.monthlyPaid.toLocaleString()}</TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono">${row.monthlyAccrued.toLocaleString()}</TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono font-bold">
              ${row.monthlyTotal.toLocaleString()}
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono">
              ${row.currentInvestment.toLocaleString()}
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono font-bold text-primary">
              {row.currentShare.toFixed(1)}%
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-primary">
              {row.projectedShare.toFixed(1)}%
            </TableCell>
          </TableRow>
        {/each}
      {:else if isAuthenticated}
        {#each myRows as row (row.personId)}
          <TableRow class="bg-primary/5">
            <TableCell class="px-4 py-3 text-sm font-medium">{row.name} (You)</TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono">{row.hoursPerWeek}</TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">
              ${Math.round(row.paidRate)}/hr
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">
              ${Math.round(row.investedRate)}/hr
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono">${row.monthlyPaid.toLocaleString()}</TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono">${row.monthlyAccrued.toLocaleString()}</TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono font-bold">
              ${row.monthlyTotal.toLocaleString()}
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono">
              ${row.currentInvestment.toLocaleString()}
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono font-bold text-primary">
              {row.currentShare.toFixed(1)}%
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-primary">
              {row.projectedShare.toFixed(1)}%
            </TableCell>
          </TableRow>
        {/each}
        {#if otherRows.length > 0}
          <TableRow>
            <TableCell class="px-4 py-3 text-sm font-medium text-muted-foreground">
              Others ({othersCount})
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
              {othersAgg.hoursPerWeek}
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">
              ${Math.round(othersAgg.paidRate)}/hr
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">
              ${Math.round(othersAgg.investedRate)}/hr
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
              ${othersAgg.monthlyPaid.toLocaleString()}
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
              ${othersAgg.monthlyAccrued.toLocaleString()}
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono font-bold">
              ${othersAgg.monthlyTotal.toLocaleString()}
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
              ${othersAgg.currentInvestment.toLocaleString()}
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono font-bold text-primary">
              {othersAgg.currentShare.toFixed(1)}%
            </TableCell>
            <TableCell class="px-4 py-3 text-right text-sm font-mono text-primary">
              {othersAgg.projectedShare.toFixed(1)}%
            </TableCell>
          </TableRow>
        {/if}
      {:else}
        <TableRow>
          <TableCell class="px-4 py-3 text-sm font-medium">Team ({teamCount})</TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono">{teamAgg.hoursPerWeek}</TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">
            ${Math.round(teamAgg.paidRate)}/hr
          </TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">
            ${Math.round(teamAgg.investedRate)}/hr
          </TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono">${teamAgg.monthlyPaid.toLocaleString()}</TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono">${teamAgg.monthlyAccrued.toLocaleString()}</TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono font-bold">
            ${teamAgg.monthlyTotal.toLocaleString()}
          </TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono">
            ${teamAgg.currentInvestment.toLocaleString()}
          </TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono font-bold text-primary">
            {teamAgg.currentShare.toFixed(1)}%
          </TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono text-primary">
            {teamAgg.projectedShare.toFixed(1)}%
          </TableCell>
        </TableRow>
      {/if}

      {#if isAuthenticated}
        <TableRow class="border-t-2 border-t-border bg-muted/50 font-semibold">
          <TableCell class="px-4 py-3 text-sm font-semibold">Total ({teamCount})</TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono">{teamAgg.hoursPerWeek}</TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono text-[var(--red)]">
            ${teamAgg.paidRate}/hr
          </TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono text-[var(--orange)]">
            ${teamAgg.investedRate}/hr
          </TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono">${teamAgg.monthlyPaid.toLocaleString()}</TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono">${teamAgg.monthlyAccrued.toLocaleString()}</TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono font-bold">
            ${teamAgg.monthlyTotal.toLocaleString()}
          </TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono">${teamAgg.currentInvestment.toLocaleString()}</TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono font-bold text-primary">
            {teamAgg.currentShare.toFixed(1)}%
          </TableCell>
          <TableCell class="px-4 py-3 text-right text-sm font-mono text-primary">
            {teamAgg.projectedShare.toFixed(1)}%
          </TableCell>
        </TableRow>
      {/if}
    </TableBody>
  </Table>
</div>
