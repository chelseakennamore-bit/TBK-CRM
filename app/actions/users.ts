"use server";

import { requireAuth } from "@/lib/authGuard";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(formData: FormData) {
  const session = await requireAuth();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!name || !email || password.length < 8) return;

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });
  await logAudit(session, {
    action: "create",
    entityType: "User",
    entityId: user.id,
    entityLabel: user.name,
    detail: user.email,
  });
  revalidatePath("/users");
}

export async function setUserActive(userId: string, active: boolean) {
  const session = await requireAuth();
  if (userId === session.user.id && !active) {
    // Refuse to let someone lock themselves out -- there's no other admin
    // to reactivate them.
    return { ok: false, error: "You can't deactivate your own account." };
  }

  const user = await prisma.user.update({ where: { id: userId }, data: { active } });
  await logAudit(session, {
    action: "status_change",
    entityType: "User",
    entityId: user.id,
    entityLabel: user.name,
    detail: active ? "Reactivated" : "Deactivated",
  });
  revalidatePath("/users");
  return { ok: true };
}
