<script setup lang="ts">
definePageMeta({ layout: "blank" });

type Mode = "login" | "register" | "forgot-password";

const mode = ref<Mode>("login");
const email = ref("");
const password = ref("");
const name = ref("");
const error = ref("");
const success = ref("");
const loading = ref(false);

const title = computed(() =>
  mode.value === "login" ? "Sign In" : mode.value === "register" ? "Create Account" : "Reset Password",
);

async function handleSubmit() {
  error.value = "";
  success.value = "";
  loading.value = true;

  try {
    if (mode.value === "login") {
      await $fetch("/api/auth/login", {
        method: "POST",
        body: { email: email.value, password: password.value },
      });
      await sessionFetch();
      await navigateTo("/");
    } else if (mode.value === "register") {
      await $fetch("/api/auth/register", {
        method: "POST",
        body: { email: email.value, password: password.value, name: name.value },
      });
      await $fetch("/api/auth/login", {
        method: "POST",
        body: { email: email.value, password: password.value },
      });
      await sessionFetch();
      await navigateTo("/");
    } else {
      await $fetch("/api/auth/forgot-password", {
        method: "POST",
        body: { email: email.value },
      });
      success.value = "If that email exists, a reset link has been sent.";
    }
  } catch (e) {
    if (mode.value === "login") error.value = "Invalid email or password";
    else if (mode.value === "register")
      error.value = (e as { data?: { message?: string } })?.data?.message ?? "Registration failed";
    else error.value = "Something went wrong. Please try again.";
  } finally {
    loading.value = false;
  }
}

function switchMode(newMode: Mode) {
  mode.value = newMode;
  error.value = "";
  success.value = "";
}

const { fetch: sessionFetch } = useUserSession();
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center"
    style="background: linear-gradient(135deg, #f0f4ff 0%, #f8f9fb 50%, #fdf2f8 100%)"
  >
    <div
      class="rounded-2xl bg-[var(--bg-card)] p-8 w-full max-w-sm space-y-6"
      style="box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08)"
    >
      <div class="space-y-1">
        <h1 class="text-xl font-bold text-[var(--accent)]">Atma Finances</h1>
        <p class="text-sm text-[var(--text-muted)]">{{ title }}</p>
      </div>

      <p v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
      <p v-if="success" class="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{{ success }}</p>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <input
          v-if="mode === 'register'"
          v-model="name"
          type="text"
          placeholder="Name"
          class="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
          class="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <input
          v-if="mode !== 'forgot-password'"
          v-model="password"
          type="password"
          placeholder="Password"
          required
          minlength="8"
          class="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {{ loading ? "..." : title }}
        </button>
      </form>

      <template v-if="mode === 'login'">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-[var(--border)]" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="bg-[var(--bg-card)] px-2 text-[var(--text-muted)]">or</span>
          </div>
        </div>
        <a
          href="/auth/google"
          class="block w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-center text-sm font-medium transition-colors hover:bg-[var(--bg-card-hover)]"
        >
          Sign in with Google
        </a>
      </template>

      <div class="flex justify-between text-xs text-[var(--text-muted)]">
        <template v-if="mode === 'login'">
          <button type="button" class="hover:text-[var(--accent)] transition-colors" @click="switchMode('register')">
            Create account
          </button>
          <button
            type="button"
            class="hover:text-[var(--accent)] transition-colors"
            @click="switchMode('forgot-password')"
          >
            Forgot password?
          </button>
        </template>
        <button
          v-else
          type="button"
          class="hover:text-[var(--accent)] transition-colors"
          @click="switchMode('login')"
        >
          Back to sign in
        </button>
      </div>

      <div class="border-t border-[var(--border)] pt-4 text-center">
        <p class="text-xs text-[var(--text-muted)]">Want to browse without signing in?</p>
        <NuxtLink to="/" class="mt-1 inline-block text-sm font-medium text-[var(--accent)] hover:underline">
          Continue as guest
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
