<script lang="ts">
  import { page } from "$app/stores";
  import { goto, invalidateAll } from "$app/navigation";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Avatar, AvatarImage, AvatarFallback } from "$lib/components/ui/avatar/index.js";
  import type { SessionUser } from "$lib/types";

  export let user: SessionUser | null = null;

  const links = [
    { href: "/finances", label: "Overview" },
    { href: "/transactions", label: "Transactions" },
    { href: "/hr", label: "People" },
  ];

  $: navLinks = user?.isSuperAdmin ? [...links, { href: "/admin", label: "Admin" }] : links;

  $: userInitial = (user?.name ?? user?.email ?? "?")[0]?.toUpperCase() ?? "?";

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    await invalidateAll();
    await goto("/login");
  }
</script>

<nav class="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
  <div class="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3 sm:px-6 lg:px-8">
    <a href="/finances" class="text-lg font-bold tracking-tight text-primary">Atma Dashboard</a>
    <div class="flex flex-1 gap-1">
      {#each navLinks as link}
        <a
          href={link.href}
          class={$page.url.pathname === link.href
            ? "rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
            : "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"}
        >
          {link.label}
        </a>
      {/each}
    </div>
    <div class="flex items-center gap-3">
      {#if user}
        <Avatar class="size-8">
          {#if user.image}
            <AvatarImage src={user.image} alt={user.name ?? ""} referrerpolicy="no-referrer" />
          {/if}
          <AvatarFallback class="bg-primary/10 text-primary text-xs font-semibold">{userInitial}</AvatarFallback>
        </Avatar>
        <span class="text-sm font-medium text-foreground">{user.name ?? user.email}</span>
        <Button variant="ghost" class="h-8 px-3 text-muted-foreground" onclick={signOut}>Sign out</Button>
      {:else}
        <Button href="/login">Sign in</Button>
      {/if}
    </div>
  </div>
</nav>
