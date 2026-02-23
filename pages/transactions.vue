<script setup lang="ts">
const { data } = await useFetch("/api/data/transactions");
</script>

<template>
  <div v-if="data" class="space-y-6">
    <h1 class="text-2xl font-bold">Transactions</h1>
    <TransactionsTable
      :transactions="data.transactions"
      :highlight-payee-ids="data.highlightPayeeIds"
      :masked-payee-ids="data.maskedPayeeIds"
    />
  </div>
</template>
