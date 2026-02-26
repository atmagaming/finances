<script lang="ts">
  import TransactionsTable from "$lib/components/TransactionsTable.svelte";

  export let data: { data: any };
  const payload = data.data;
</script>

{#if payload}
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Transactions</h1>
      <p class="mt-1 text-sm text-muted-foreground">Browse and filter all recorded transactions.</p>
    </div>
    <TransactionsTable
      transactions={payload.transactions}
      highlightPayeeIds={payload.highlightPayeeIds}
      maskedPayeeIds={payload.maskedPayeeIds}
    />
  </div>
{/if}
