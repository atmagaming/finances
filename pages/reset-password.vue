<script setup lang="ts">
definePageMeta({ layout: "blank" });

const route = useRoute();
const token = computed(() => (route.query.token as string) ?? "");
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const success = ref(false);
const loading = ref(false);

async function handleSubmit() {
  error.value = "";

  if (password.value !== confirmPassword.value) {
    error.value = "Passwords do not match";
    return;
  }

  loading.value = true;
  try {
    await $fetch("/api/auth/reset-password", {
      method: "POST",
      body: { token: token.value, password: password.value },
    });
    success.value = true;
  } catch (e) {
    error.value = (e as { data?: { message?: string } })?.data?.message ?? "Something went wrong. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div v-if="!token" class="text-[var(--text-muted)]">Invalid reset link.</div>

    <div
      v-else-if="success"
      class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 w-full max-w-sm space-y-4 text-center"
    >
      <p class="text-sm text-green-500">Password reset successfully.</p>
      <NuxtLink to="/login" class="text-sm text-[var(--accent)] hover:underline">Back to sign in</NuxtLink>
    </div>

    <div v-else class="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 w-full max-w-sm space-y-6">
      <div class="space-y-1">
        <h1 class="text-xl font-bold text-[var(--accent)]">Atma Finances</h1>
        <p class="text-sm text-[var(--text-muted)]">Set new password</p>
      </div>

      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <input
          v-model="password"
          type="password"
          placeholder="New password"
          required
          minlength="8"
          class="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Confirm password"
          required
          minlength="8"
          class="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {{ loading ? "..." : "Reset Password" }}
        </button>
      </form>
    </div>
  </div>
</template>
