import type { RequestHandler } from "./$types";
import { clearSessionCookie } from "$lib/server/auth";

export const POST: RequestHandler = async (event) => {
  clearSessionCookie(event);
  return new Response(JSON.stringify({ success: true }));
};
