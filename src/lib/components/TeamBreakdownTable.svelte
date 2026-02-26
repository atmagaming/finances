<script lang="ts">
  import Table from "$lib/components/ui/table.svelte";
  import TableHeader from "$lib/components/ui/table-header.svelte";
  import TableBody from "$lib/components/ui/table-body.svelte";
  import TableRow from "$lib/components/ui/table-row.svelte";
  import TableHead from "$lib/components/ui/table-head.svelte";
  import TableCell from "$lib/components/ui/table-cell.svelte";

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

<div class="rounded-xl bg-(--bg-card) p-6" style="box-shadow: var(--shadow)">
  <h2 class="mb-4 text-lg font-semibold">Active Team Breakdown</h2>
  <Table>
    <TableHeader>
      <TableRow className="border-b border-(--border) hover:bg-transparent">
        <TableHead className="px-4 py-3 text-left">Person</TableHead>
        <TableHead className="px-4 py-3 text-right">Hours/Week</TableHead>
        <TableHead className="px-4 py-3 text-right">Paid $/hr</TableHead>
        <TableHead className="px-4 py-3 text-right">Invested $/hr</TableHead>
        <TableHead className="px-4 py-3 text-right">Monthly Paid</TableHead>
        <TableHead className="px-4 py-3 text-right">Monthly Accrued</TableHead>
        <TableHead className="px-4 py-3 text-right">Monthly Total</TableHead>
        <TableHead className="px-4 py-3 text-right">Current Investment</TableHead>
        <TableHead className="px-4 py-3 text-right">Current Share</TableHead>
        <TableHead className="px-4 py-3 text-right">Projected Share (Oct 2027)</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#if isAdmin}
        {#each rows as row (row.personId)}
          <TableRow className={row.isCurrentUser ? "bg-(--accent-light)" : ""}>
            <TableCell className="px-4 py-3 text-sm font-medium">
              {row.isCurrentUser ? `${row.name} (You)` : row.name}
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono">{row.hoursPerWeek}</TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--red)">
              ${Math.round(row.paidRate)}/hr
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--orange)">
              ${Math.round(row.investedRate)}/hr
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono">${row.monthlyPaid.toLocaleString()}</TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono">${row.monthlyAccrued.toLocaleString()}</TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono font-bold">
              ${row.monthlyTotal.toLocaleString()}
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono">
              ${row.currentInvestment.toLocaleString()}
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono font-bold text-(--accent)">
              {row.currentShare.toFixed(1)}%
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--accent)">
              {row.projectedShare.toFixed(1)}%
            </TableCell>
          </TableRow>
        {/each}
      {:else if isAuthenticated}
        {#each myRows as row (row.personId)}
          <TableRow className="bg-(--accent-light)">
            <TableCell className="px-4 py-3 text-sm font-medium">{row.name} (You)</TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono">{row.hoursPerWeek}</TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--red)">
              ${Math.round(row.paidRate)}/hr
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--orange)">
              ${Math.round(row.investedRate)}/hr
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono">${row.monthlyPaid.toLocaleString()}</TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono">${row.monthlyAccrued.toLocaleString()}</TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono font-bold">
              ${row.monthlyTotal.toLocaleString()}
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono">
              ${row.currentInvestment.toLocaleString()}
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono font-bold text-(--accent)">
              {row.currentShare.toFixed(1)}%
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--accent)">
              {row.projectedShare.toFixed(1)}%
            </TableCell>
          </TableRow>
        {/each}
        {#if otherRows.length > 0}
          <TableRow>
            <TableCell className="px-4 py-3 text-sm font-medium text-(--text-muted)">
              Others ({othersCount})
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--text-muted)">
              {othersAgg.hoursPerWeek}
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--red)">
              ${Math.round(othersAgg.paidRate)}/hr
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--orange)">
              ${Math.round(othersAgg.investedRate)}/hr
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--text-muted)">
              ${othersAgg.monthlyPaid.toLocaleString()}
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--text-muted)">
              ${othersAgg.monthlyAccrued.toLocaleString()}
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono font-bold">
              ${othersAgg.monthlyTotal.toLocaleString()}
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--text-muted)">
              ${othersAgg.currentInvestment.toLocaleString()}
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono font-bold text-(--accent)">
              {othersAgg.currentShare.toFixed(1)}%
            </TableCell>
            <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--accent)">
              {othersAgg.projectedShare.toFixed(1)}%
            </TableCell>
          </TableRow>
        {/if}
      {:else}
        <TableRow>
          <TableCell className="px-4 py-3 text-sm font-medium">Team ({teamCount})</TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono">{teamAgg.hoursPerWeek}</TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--red)">
            ${Math.round(teamAgg.paidRate)}/hr
          </TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--orange)">
            ${Math.round(teamAgg.investedRate)}/hr
          </TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono">${teamAgg.monthlyPaid.toLocaleString()}</TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono">${teamAgg.monthlyAccrued.toLocaleString()}</TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono font-bold">
            ${teamAgg.monthlyTotal.toLocaleString()}
          </TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono">
            ${teamAgg.currentInvestment.toLocaleString()}
          </TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono font-bold text-(--accent)">
            {teamAgg.currentShare.toFixed(1)}%
          </TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--accent)">
            {teamAgg.projectedShare.toFixed(1)}%
          </TableCell>
        </TableRow>
      {/if}

      {#if isAuthenticated}
        <TableRow className="border-t-2 border-t-(--text-muted) bg-(--bg-card-hover) font-semibold">
          <TableCell className="px-4 py-3 text-sm font-medium">Total ({teamCount})</TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono">{teamAgg.hoursPerWeek}</TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--red)">
            ${teamAgg.paidRate}/hr
          </TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--orange)">
            ${teamAgg.investedRate}/hr
          </TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono">${teamAgg.monthlyPaid.toLocaleString()}</TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono">${teamAgg.monthlyAccrued.toLocaleString()}</TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono font-bold">
            ${teamAgg.monthlyTotal.toLocaleString()}
          </TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono">${teamAgg.currentInvestment.toLocaleString()}</TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono font-bold text-(--accent)">
            {teamAgg.currentShare.toFixed(1)}%
          </TableCell>
          <TableCell className="px-4 py-3 text-right text-sm font-mono text-(--accent)">
            {teamAgg.projectedShare.toFixed(1)}%
          </TableCell>
        </TableRow>
      {/if}
    </TableBody>
  </Table>
</div>
