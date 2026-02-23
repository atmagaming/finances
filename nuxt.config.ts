import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  modules: ["nuxt-auth-utils"],
  vite: {
    // biome-ignore lint/suspicious/noExplicitAny: vite/rollup plugin type mismatch
    plugins: [tailwindcss() as any],
  },
  compatibilityDate: "2025-01-01",
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "Atma Finances",
      meta: [{ name: "description", content: "Financial dashboard for Atma Gaming" }],
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        },
      ],
    },
  },
  runtimeConfig: {
    notionApiKey: "",
    notionPeopleDbId: "",
    notionSensitiveDataDbId: "",
    notionTransactionsDbId: "",
    notionPayeesDbId: "",
    notionVacationsDbId: "",
    tursoDatabaseUrl: "",
    tursoAuthToken: "",
    authGoogleId: "",
    authGoogleSecret: "",
    resendApiKey: "",
    resendFromEmail: "noreply@example.com",
    superAdminEmails: "",
    session: {
      password: "",
    },
    public: {
      authUrl: "http://localhost:3000",
    },
  },
});
