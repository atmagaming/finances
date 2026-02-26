<script lang="ts">
  import { cn } from "$lib/utils";
  export let variant: "default" | "success" | "warning" | "danger" | "info" = "default";
  export let className = "";

  const variants = {
    default: "bg-(--bg-card-hover) text-(--text)",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-violet-50 text-violet-700",
  };
</script>

<span class={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}>
  <slot />
</span>
