<script lang="ts">
  import { cn } from "$lib/utils";
  export let className = "";
</script>

<input
  class={cn(
    "flex h-9 w-full rounded-md border border-(--border) bg-(--bg) px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-(--text-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2",
    className,
  )}
  {...$$restProps}
/>
