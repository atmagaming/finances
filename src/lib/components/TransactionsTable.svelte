<script lang="ts">
  import type { Transaction } from "$lib/types";
  import NativeSelect from "$lib/components/ui/native-select.svelte";
  import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";

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

<div class="rounded-xl border border-border bg-card shadow-sm">
  <div class="flex flex-wrap gap-3 border-b border-border p-4">
    <NativeSelect bind:value={methodFilter}>
      <option value="all">All Methods</option>
      {#each methods as method}
        <option value={method}>{method}</option>
      {/each}
    </NativeSelect>
    <NativeSelect bind:value={categoryFilter}>
      <option value="all">All Categories</option>
      {#each categories as category}
        <option value={category}>{category}</option>
      {/each}
    </NativeSelect>
    <span class="ml-auto self-center text-sm text-muted-foreground">{filtered.length} transactions</span>
  </div>

  <Table>
    <TableHeader>
      <TableRow class="border-b border-border hover:bg-transparent">
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
          class={highlightSet.has(tx.payeeId)
            ? "bg-primary/5"
            : maskedSet.has(tx.payeeId)
              ? "bg-muted/40"
              : ""}
        >
          <TableCell class="whitespace-nowrap px-3 py-2.5 text-sm">{formatDate(tx.logicalDate)}</TableCell>
          <TableCell
            class={`max-w-xs truncate px-3 py-2.5 text-sm ${maskedSet.has(tx.payeeId) ? "text-muted-foreground" : ""}`}
          >
            {tx.note}
          </TableCell>
          <TableCell class={`px-3 py-2.5 text-sm ${maskedSet.has(tx.payeeId) ? "text-muted-foreground" : ""}`}>
            {tx.payeeName}
          </TableCell>
          <TableCell class={`px-3 py-2.5 text-sm ${maskedSet.has(tx.payeeId) ? "text-muted-foreground" : ""}`}>
            {tx.category}
          </TableCell>
          <TableCell class="px-3 py-2.5 text-sm">
            <Badge
              variant={tx.method === "Paid" ? "destructive" : tx.method === "Accrued" ? "outline" : "secondary"}
              class={tx.method === "Accrued" ? "border-amber-400 bg-amber-50 text-amber-700" : tx.method === "Invested" ? "bg-violet-50 text-violet-700 border-violet-200" : ""}
            >
              {tx.method}
            </Badge>
          </TableCell>
          <TableCell
            class={`whitespace-nowrap px-3 py-2.5 text-sm font-mono ${
              maskedSet.has(tx.payeeId)
                ? "cursor-help text-muted-foreground"
                : tx.usdEquivalent > 0
                  ? "text-[var(--green)]"
                  : "text-[var(--red)]"
            }`}
            onmouseenter={maskedSet.has(tx.payeeId) ? showTooltip : undefined}
            onmouseleave={maskedSet.has(tx.payeeId) ? hideTooltip : undefined}
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
    class="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
    style={`left: ${tooltip.x}px; top: ${tooltip.y - 6}px;`}
  >
    Other team members' salaries are hidden
  </div>
{/if}
