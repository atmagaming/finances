<script lang="ts">
  import { page } from "$app/stores";
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
  <p class="text-6xl font-bold text-muted-foreground">{$page.status}</p>
  <h1 class="text-2xl font-semibold text-foreground">{$page.error?.message ?? "Something went wrong"}</h1>
  <a href="/" class="text-sm text-primary underline underline-offset-4">Go back home</a>
</div>
