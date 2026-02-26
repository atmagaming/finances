<script lang="ts">
  import { cn } from "$lib/utils";
  export let className = "";
</script>

<thead class={cn("[&_tr]:border-b", className)}>
  <slot />
</thead>
