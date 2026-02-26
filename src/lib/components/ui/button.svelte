<script lang="ts">
  import { cn } from "$lib/utils";

  export let variant: "default" | "outline" | "ghost" | "secondary" = "default";
  export let size: "default" | "sm" | "lg" = "default";
  export let className = "";

  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-(--accent) text-white hover:bg-(--accent-hover)",
    outline: "border border-(--border) bg-transparent text-(--text) hover:bg-(--bg-card-hover)",
    ghost: "bg-transparent text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-(--text)",
    secondary: "bg-(--bg-card) text-(--text) border border-(--border)",
  };
  const sizes = {
    default: "h-9 px-4",
    sm: "h-8 px-3 text-xs",
    lg: "h-10 px-6",
  };
</script>

<button class={cn(base, variants[variant], sizes[size], className)} {...$$restProps}>
  <slot />
</button>
