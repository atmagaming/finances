<script lang="ts">
  export let label: string;
  export let value: number;
  export let color: string;
  export let bg: string;
</script>

<div class="rounded-xl p-5" style={`background: ${bg}; box-shadow: var(--shadow-sm);`}>
  <p class="text-xs font-medium text-(--text-muted)">{label}</p>
  <p class="mt-2 text-2xl font-bold" style={`color: ${color};`}>${value.toLocaleString()}</p>
</div>
