<script lang="ts">
  import type { Transaction } from "$lib/types";
  import Select from "$lib/components/ui/select.svelte";
  import Table from "$lib/components/ui/table.svelte";
  import TableHeader from "$lib/components/ui/table-header.svelte";
  import TableBody from "$lib/components/ui/table-body.svelte";
  import TableRow from "$lib/components/ui/table-row.svelte";
  import TableHead from "$lib/components/ui/table-head.svelte";
  import TableCell from "$lib/components/ui/table-cell.svelte";
  import Badge from "$lib/components/ui/badge.svelte";

  export let transactions: Transaction[] = [];
  export let highlightPayeeIds: string[] = [];
  export let maskedPayeeIds: string[] = [];

  let methodFilter = "all";
  let categoryFilter = "all";
  let tooltip: { x: number; y: number } | null = null;
  let tooltipTimeout: ReturnType<typeof setTimeout> | undefined;

  $: highlightSet = new Set(highlightPayeeIds);
  $: maskedSet = new Set(maskedPayeeIds);

  $: categories = [...new Set(transactions.map((t) => t.category).filter(Boolean))].sort();
  const methods = ["Paid", "Accrued", "Invested"];

  $: filtered = (() => {
    let result = transactions;
    if (methodFilter !== "all") result = result.filter((t) => t.method === methodFilter);
    if (categoryFilter !== "all") result = result.filter((t) => t.category === categoryFilter);
    return result;
  })();

  function formatDate(iso: string) {
    const parts = iso.split("-");
    const year = parts[0] ?? "";
    const month = parts[1] ?? "1";
    const day = parts[2] ?? "";
    const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" });
    return `${day} ${monthName} ${year.slice(2)}`;
  }

  function showTooltip(event: MouseEvent) {
    clearTimeout(tooltipTimeout);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    tooltip = { x: rect.left + rect.width / 2, y: rect.top };
  }

  function hideTooltip() {
    tooltipTimeout = setTimeout(() => {
      tooltip = null;
    }, 50);
  }
</script>

<div class="rounded-xl bg-(--bg-card)" style="box-shadow: var(--shadow)">
  <div class="flex gap-4 border-b border-(--border) p-4">
    <Select bind:value={methodFilter}>
      <option value="all">All Methods</option>
      {#each methods as m}
        <option value={m}>{m}</option>
      {/each}
    </Select>
    <Select bind:value={categoryFilter}>
      <option value="all">All Categories</option>
      {#each categories as c}
        <option value={c}>{c}</option>
      {/each}
    </Select>
    <span class="ml-auto self-center text-sm text-(--text-muted)">{filtered.length} transactions</span>
  </div>

  <Table>
    <TableHeader>
      <TableRow className="border-b border-(--border) hover:bg-transparent">
        <TableHead>Date</TableHead>
        <TableHead>Description</TableHead>
        <TableHead>Payee</TableHead>
        <TableHead>Category</TableHead>
        <TableHead>Method</TableHead>
        <TableHead>USD</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {#each filtered as tx (tx.id)}
        <TableRow
          className={
            highlightSet.has(tx.payeeId)
              ? "bg-(--accent-light)"
              : maskedSet.has(tx.payeeId)
                ? "bg-(--bg-card-hover)"
                : ""
          }
        >
          <TableCell className="whitespace-nowrap px-3 py-2.5 text-sm">{formatDate(tx.logicalDate)}</TableCell>
          <TableCell
            className={`max-w-xs truncate px-3 py-2.5 text-sm ${
              maskedSet.has(tx.payeeId) ? "text-(--text-muted)" : ""
            }`}
          >
            {tx.note}
          </TableCell>
          <TableCell className={`px-3 py-2.5 text-sm ${maskedSet.has(tx.payeeId) ? "text-(--text-muted)" : ""}`}>
            {tx.payeeName}
          </TableCell>
          <TableCell className={`px-3 py-2.5 text-sm ${maskedSet.has(tx.payeeId) ? "text-(--text-muted)" : ""}`}>
            {tx.category}
          </TableCell>
          <TableCell className="px-3 py-2.5 text-sm">
            <Badge
              variant={
                tx.method === "Paid" ? "danger" : tx.method === "Accrued" ? "warning" : "info"
              }
            >
              {tx.method}
            </Badge>
          </TableCell>
          <TableCell
            className={`whitespace-nowrap px-3 py-2.5 text-sm font-mono ${
              maskedSet.has(tx.payeeId)
                ? "cursor-help text-(--text-muted)"
                : tx.usdEquivalent > 0
                  ? "text-(--green)"
                  : "text-(--red)"
            }`}
            on:mouseenter={maskedSet.has(tx.payeeId) ? showTooltip : undefined}
            on:mouseleave={maskedSet.has(tx.payeeId) ? hideTooltip : undefined}
          >
            {#if maskedSet.has(tx.payeeId)}
              <img src="/question.png" alt="Hidden" width="16" height="16" class="inline opacity-40" />
            {:else}
              ${Math.abs(tx.usdEquivalent).toLocaleString()}
            {/if}
          </TableCell>
        </TableRow>
      {/each}
    </TableBody>
  </Table>
</div>

{#if tooltip}
  <div
    class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded bg-gray-800 px-2.5 py-1.5 text-xs text-white shadow-lg"
    style={`left: ${tooltip.x}px; top: ${tooltip.y - 6}px;`}
  >
    Other team members' salaries are hidden
  </div>
{/if}
