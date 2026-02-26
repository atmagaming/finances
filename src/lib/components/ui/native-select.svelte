<script lang="ts">
  import { cn } from "$lib/utils.js";
  export let className = "";
</script>

<select
  class={cn(
    "h-9 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-xs transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
    className,
  )}
  {...$$restProps}
>
  <slot />
</select>
