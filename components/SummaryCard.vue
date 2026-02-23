<script setup lang="ts">
defineProps<{
  label: string;
  value: number;
  color: string;
  bg: string;
}>();
</script>

<template>
  <div class="rounded-xl p-5" :style="{ background: bg, boxShadow: 'var(--shadow-sm)' }">
    <p class="text-xs font-medium text-[var(--text-muted)]">{{ label }}</p>
    <p class="mt-2 text-2xl font-bold" :style="{ color }">${{ value.toLocaleString() }}</p>
  </div>
</template>
