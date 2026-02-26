<script lang="ts">
  import "../app.css";
  import { page } from "$app/stores";
  import AppNav from "$lib/components/AppNav.svelte";
  export let data: { user: import("$lib/types").SessionUser | null };

  $: isAuthPage = $page.url.pathname === "/login" || $page.url.pathname === "/reset-password";
</script>

<svelte:head>
  <title>Atma Finances</title>
  <meta name="description" content="Financial dashboard for Atma Gaming" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
  />
</svelte:head>

{#if isAuthPage}
  <slot />
{:else}
  <div>
    <AppNav user={data.user} />
    <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
{/if}
