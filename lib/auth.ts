import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

async function isLockedOut(email: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const count = await prisma.loginAttempt.count({
    where: { email, createdAt: { gt: since } },
  });
  return count >= MAX_ATTEMPTS;
}

async function recordFailedAttempt(email: string) {
  await prisma.loginAttempt.create({ data: { email } });
  // Opportunistic cleanup so this table doesn't grow unbounded -- no cron
  // needed for a table this low-volume.
  const staleCutoff = new Date(Date.now() - 60 * 60 * 1000);
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: staleCutoff } },
  });
}

async function clearAttempts(email: string) {
  await prisma.loginAttempt.deleteMany({ where: { email } });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        if (await isLockedOut(email)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await recordFailedAttempt(email);
          return null;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordFailedAttempt(email);
          return null;
        }
        await clearAttempts(email);
        return { id: user.id, email: user.email };
      },
    }),
  ],
});
