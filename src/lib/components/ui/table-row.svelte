<script lang="ts">
  import { cn } from "$lib/utils";
  export let className = "";
</script>

<tr class={cn("border-b border-(--border) transition-colors hover:bg-(--bg-card-hover)", className)}>
  <slot />
</tr>
