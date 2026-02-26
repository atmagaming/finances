<script lang="ts">
  import { page } from "$app/stores";
  import { goto, invalidateAll } from "$app/navigation";
  import Button from "$lib/components/ui/button.svelte";
  import type { SessionUser } from "$lib/types";

  export let user: SessionUser | null = null;

  const links = [
    { href: "/", label: "Overview" },
    { href: "/transactions", label: "Transactions" },
  ];

  $: navLinks = user?.isSuperAdmin ? [...links, { href: "/admin", label: "Admin" }] : links;

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    await invalidateAll();
    await goto("/login");
  }
</script>

<nav class="bg-(--bg-card)" style="box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05)">
  <div class="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3 sm:px-6 lg:px-8">
    <a href="/" class="text-lg font-bold tracking-tight text-(--accent)">Atma Finances</a>
    <div class="flex flex-1 gap-1">
      {#each navLinks as link}
        <a
          href={link.href}
          class={
            $page.url.pathname === link.href
              ? "rounded-lg bg-(--accent-light) px-3 py-1.5 text-sm font-medium text-(--accent)"
              : "rounded-lg px-3 py-1.5 text-sm font-medium text-(--text-muted) transition-colors hover:bg-(--bg-card-hover) hover:text-(--text)"
          }
        >
          {link.label}
        </a>
      {/each}
    </div>
    <div class="flex items-center gap-3">
      {#if user}
        {#if user.image}
          <img
            src={user.image}
            alt={user.name ?? ""}
            width="32"
            height="32"
            referrerpolicy="no-referrer"
            class="rounded-full ring-2 ring-(--border)"
          />
        {/if}
        <span class="text-sm font-medium text-(--text)">{user.name ?? user.email}</span>
        <Button variant="ghost" className="h-8 px-3" on:click={signOut}>Sign out</Button>
      {:else}
        <a href="/login">
          <Button>Sign in</Button>
        </a>
      {/if}
    </div>
  </div>
</nav>
