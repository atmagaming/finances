<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();
const route = useRoute();

const links = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
];

const navLinks = computed(() => {
  if (user.value?.isSuperAdmin) return [...links, { href: "/admin", label: "Admin" }];
  return links;
});

async function signOut() {
  await clear();
  await navigateTo("/login");
}
</script>

<template>
  <nav class="bg-[var(--bg-card)]" style="box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05)">
    <div class="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="text-lg font-bold tracking-tight text-[var(--accent)]">Atma Finances</NuxtLink>
      <div class="flex flex-1 gap-1">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.href"
          :to="link.href"
          :class="[
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            route.path === link.href
              ? 'bg-[var(--accent-light)] text-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)]',
          ]"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
      <div class="flex items-center gap-3">
        <template v-if="loggedIn">
          <img
            v-if="user?.image"
            :src="user.image"
            :alt="user.name ?? ''"
            width="32"
            height="32"
            referrerpolicy="no-referrer"
            class="rounded-full ring-2 ring-[var(--border)]"
          />
          <span class="text-sm font-medium text-[var(--text)]">{{ user?.name }}</span>
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)] hover:bg-[var(--bg-card-hover)]"
            @click="signOut"
          >
            Sign out
          </button>
        </template>
        <NuxtLink
          v-else
          to="/login"
          class="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          Sign in
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>
