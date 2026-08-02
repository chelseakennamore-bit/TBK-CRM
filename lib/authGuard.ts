import { auth } from "@/lib/auth";

// Defense-in-depth for Server Actions. proxy.ts already blocks
// unauthenticated requests to every route that can invoke an action, but
// that's the only layer protecting these mutations -- call this first in
// every exported action so a proxy.ts regression can't silently open up
// every write in the app.
export async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }
}
