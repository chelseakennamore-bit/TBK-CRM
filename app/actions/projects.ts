"use server";

import { requireAuth } from "@/lib/authGuard";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findOrCreateCompanyId } from "@/app/actions/companies";

function revalidateProjectViews() {
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/companies");
}

export async function createProject(formData: FormData) {
  const session = await requireAuth();
  const name = String(formData.get("name") || "").trim() || "New Engagement";
  const client = String(formData.get("client") || "").trim() || "—";
  const dueDateRaw = String(formData.get("dueDate") || "");
  const companyId = await findOrCreateCompanyId(client);

  const project = await prisma.project.create({
    data: {
      name,
      client,
      companyId,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    },
  });
  await logAudit(session, {
    action: "create",
    entityType: "Project",
    entityId: project.id,
    entityLabel: project.name,
  });
  revalidateProjectViews();
}

export async function deleteProject(projectId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAuth();
  let project;
  try {
    project = await prisma.project.delete({ where: { id: projectId } });
  } catch {
    return { ok: false, error: "Couldn't delete this project. It may have already been removed." };
  }
  await logAudit(session, {
    action: "delete",
    entityType: "Project",
    entityId: project.id,
    entityLabel: project.name,
  });
  revalidateProjectViews();
  return { ok: true };
}

export async function updateProjectStatus(projectId: string, status: string) {
  const session = await requireAuth();
  const project = await prisma.project.update({ where: { id: projectId }, data: { status } });
  await logAudit(session, {
    action: "status_change",
    entityType: "Project",
    entityId: project.id,
    entityLabel: project.name,
    detail: `Status changed to ${status}`,
  });
  revalidatePath("/projects");
}

export async function updateProjectDetails(
  projectId: string,
  data: {
    health?: string;
    nextDeliverable?: string;
    nextMeetingAt?: string;
    notes?: string;
    contractedValue?: number;
    actualCost?: number;
    dueDate?: string;
  }
) {
  await requireAuth();
  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.health !== undefined ? { health: data.health } : {}),
      ...(data.nextDeliverable !== undefined ? { nextDeliverable: data.nextDeliverable } : {}),
      ...(data.nextMeetingAt !== undefined
        ? { nextMeetingAt: data.nextMeetingAt ? new Date(data.nextMeetingAt) : null }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.contractedValue !== undefined ? { contractedValue: data.contractedValue } : {}),
      ...(data.actualCost !== undefined ? { actualCost: data.actualCost } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
        : {}),
    },
  });
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function updateProjectName(projectId: string, name: string) {
  await requireAuth();
  await prisma.project.update({
    where: { id: projectId },
    data: { name: name.trim() || "New Engagement" },
  });
  revalidateProjectViews();
}

export async function updateProjectCompany(projectId: string, client: string) {
  await requireAuth();
  const trimmed = client.trim() || "—";
  const companyId = await findOrCreateCompanyId(trimmed);
  await prisma.project.update({
    where: { id: projectId },
    data: { client: trimmed, companyId },
  });
  revalidateProjectViews();
}

export async function updateProjectContact(projectId: string, contactId: string) {
  await requireAuth();
  await prisma.project.update({
    where: { id: projectId },
    data: { contactId: contactId || null },
  });
  revalidatePath("/projects");
}

export async function addProjectNote(projectId: string, text: string) {
  await requireAuth();
  const trimmed = text.trim();
  if (!trimmed) return;
  await prisma.activity.create({ data: { projectId, text: trimmed } });
}

export async function addSubtask(
  projectId: string,
  text: string,
  dueDate: string
) {
  await requireAuth();
  const trimmed = text.trim();
  if (!trimmed) return null;
  const subtask = await prisma.subtask.create({
    data: {
      projectId,
      text: trimmed,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  revalidatePath("/projects");
  return { ...subtask, dueDate: subtask.dueDate ? subtask.dueDate.toISOString() : null };
}

export async function toggleSubtask(subtaskId: string, done: boolean) {
  await requireAuth();
  await prisma.subtask.update({ where: { id: subtaskId }, data: { done } });
  revalidatePath("/projects");
}

export async function deleteSubtask(subtaskId: string) {
  await requireAuth();
  await prisma.subtask.delete({ where: { id: subtaskId } }).catch(() => null);
  revalidatePath("/projects");
}

export async function addDeliverable(projectId: string, name: string, deliveredAt: string) {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const deliverable = await prisma.deliverable.create({
    data: {
      projectId,
      name: trimmed,
      ...(deliveredAt ? { deliveredAt: new Date(deliveredAt) } : {}),
    },
  });
  revalidatePath("/projects");
  return { ...deliverable, deliveredAt: deliverable.deliveredAt.toISOString() };
}

export async function addMilestone(projectId: string, name: string, dueDate: string) {
  await requireAuth();
  const trimmed = name.trim();
  if (!trimmed) return null;
  const count = await prisma.milestone.count({ where: { projectId } });
  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      name: trimmed,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: count,
    },
  });
  revalidatePath("/projects");
  return { ...milestone, dueDate: milestone.dueDate ? milestone.dueDate.toISOString() : null };
}

export async function updateMilestoneStatus(milestoneId: string, status: string) {
  await requireAuth();
  await prisma.milestone.update({ where: { id: milestoneId }, data: { status } });
  revalidatePath("/projects");
}

export async function deleteMilestone(milestoneId: string) {
  await requireAuth();
  await prisma.milestone.delete({ where: { id: milestoneId } }).catch(() => null);
  revalidatePath("/projects");
}

export async function addRisk(projectId: string, description: string, severity: string) {
  await requireAuth();
  const trimmed = description.trim();
  if (!trimmed) return null;
  const risk = await prisma.riskLogEntry.create({
    data: { projectId, description: trimmed, severity },
  });
  revalidatePath("/projects");
  return risk;
}

export async function updateRiskStatus(riskId: string, status: string) {
  await requireAuth();
  await prisma.riskLogEntry.update({ where: { id: riskId }, data: { status } });
  revalidatePath("/projects");
}

export async function updateRiskMitigation(riskId: string, mitigation: string) {
  await requireAuth();
  await prisma.riskLogEntry.update({ where: { id: riskId }, data: { mitigation } });
  revalidatePath("/projects");
}

export async function deleteRisk(riskId: string) {
  await requireAuth();
  await prisma.riskLogEntry.delete({ where: { id: riskId } }).catch(() => null);
  revalidatePath("/projects");
}

export async function addStakeholder(projectId: string, contactId: string, role: string) {
  await requireAuth();
  if (!contactId) return null;
  let stakeholder;
  try {
    stakeholder = await prisma.projectStakeholder.create({
      data: { projectId, contactId, role: role.trim() },
      include: { contact: { select: { id: true, name: true, email: true } } },
    });
  } catch {
    // Unique constraint on [projectId, contactId] -- already a stakeholder.
    return null;
  }
  revalidatePath("/projects");
  return stakeholder;
}

export async function removeStakeholder(stakeholderId: string) {
  await requireAuth();
  await prisma.projectStakeholder.delete({ where: { id: stakeholderId } }).catch(() => null);
  revalidatePath("/projects");
}
