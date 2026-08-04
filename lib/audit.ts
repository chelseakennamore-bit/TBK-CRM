import { prisma } from "@/lib/prisma";
import type { Session } from "next-auth";

type EntityType = "Lead" | "Contact" | "Company" | "Deal" | "Project" | "Invoice" | "User";
type Action = "create" | "delete" | "status_change";

// Records a key security/audit event -- who created, deleted, or changed
// the status of a record, and when. Deliberately does not log routine
// field edits (see lib/authGuard.ts's requireAuth, called just before this
// in every action, for where the session comes from). userEmail/userName
// are captured now rather than joined from User at read time, so the
// trail is unaffected by a user later being deactivated.
export async function logAudit(
  session: Session,
  params: {
    action: Action;
    entityType: EntityType;
    entityId: string;
    entityLabel: string;
    detail?: string;
  }
) {
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userEmail: session.user.email ?? "unknown",
      userName: session.user.name || "",
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel: params.entityLabel,
      detail: params.detail ?? "",
    },
  });
}
