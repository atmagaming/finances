<script lang="ts">
  import TransactionsTable from "$lib/components/TransactionsTable.svelte";

  export let data: { data: any };
  const payload = data.data;
</script>

{#if payload}
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Transactions</h1>
    <TransactionsTable
      transactions={payload.transactions}
      highlightPayeeIds={payload.highlightPayeeIds}
      maskedPayeeIds={payload.maskedPayeeIds}
    />
  </div>
{/if}
