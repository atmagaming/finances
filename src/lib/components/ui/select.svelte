<script lang="ts">
  import { cn } from "$lib/utils";
  export let className = "";
</script>

<select
  class={cn(
    "h-9 rounded-md border border-(--border) bg-(--bg) px-3 py-1.5 text-sm text-(--text) shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2",
    className,
  )}
  {...$$restProps}
>
  <slot />
</select>
