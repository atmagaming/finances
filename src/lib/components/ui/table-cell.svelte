<script lang="ts">
  import { cn } from "$lib/utils";
  export let className = "";
</script>

<td class={cn("p-4 align-middle", className)}>
  <slot />
</td>
