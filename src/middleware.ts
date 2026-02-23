import { auth } from "@/auth";

export default auth(() => {
  // Auth wrapper populates req.auth when session exists.
  // All routes are public — pages adapt their UI based on session.
});

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
