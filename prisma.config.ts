import { defineConfig } from "prisma/config";

const tursoUrl = process.env.NUXT_TURSO_DATABASE_URL;
const tursoToken = process.env.NUXT_TURSO_AUTH_TOKEN;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: tursoUrl ? `${tursoUrl}?authToken=${tursoToken}` : "file:./prisma/dev.db",
  },
});
