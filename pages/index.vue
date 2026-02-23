<script setup lang="ts">
const { data } = await useFetch("/api/data/all");
</script>

<template>
  <div v-if="data" class="space-y-6">
    <h1 class="text-2xl font-bold text-[var(--text)]">Financial Overview</h1>

    <div class="grid grid-cols-3 gap-4">
      <SummaryCard
        v-for="card in data.cards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
        :color="card.color"
        :bg="card.bg"
      />
    </div>

    <ClientOnly>
      <ExpenseChart :historical="data.monthlyExpenses" :projections="data.projections" />
    </ClientOnly>

    <ClientOnly v-if="data.isAuthenticated">
      <RevenueChart :data="data.revenueShares" />
    </ClientOnly>

    <ClientOnly>
      <InvestmentChart :data="data.investmentTimeline" />
    </ClientOnly>

    <TeamBreakdownTable
      :rows="data.teamRows"
      :current-person-id="data.currentPersonId"
      :is-admin="data.isAdmin"
      :is-authenticated="data.isAuthenticated"
      :team-count="data.teamCount"
    />
  </div>
</template>
