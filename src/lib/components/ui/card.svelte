<script lang="ts">
  import { cn } from "$lib/utils";
  export let className = "";
</script>

<div class={cn("rounded-xl border border-(--border) bg-(--bg-card) text-(--text) shadow-sm", className)}>
  <slot />
</div>
