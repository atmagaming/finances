import { env } from "$env/dynamic/private";

export function getSuperAdminEmails(): string[] {
  return (env.SUPER_ADMIN_EMAILS || "").split(",").map((e) => e.trim()).filter(Boolean);
}
