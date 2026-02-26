import type { Handle } from "@sveltejs/kit";
import { getSessionUser } from "$lib/server/auth";

export const handle: Handle = async ({ event, resolve }) => {
  try {
    event.locals.user = getSessionUser(event);
  } catch (e) {
    console.error("Session parsing failed:", e);
    event.locals.user = null;
  }
  return resolve(event);
};
