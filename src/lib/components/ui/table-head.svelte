<script lang="ts">
  import { cn } from "$lib/utils";
  export let className = "";
</script>

<th class={cn("h-12 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-(--text-muted)", className)}>
  <slot />
</th>
