"use server";

import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findOrCreateCompanyId } from "@/app/actions/companies";

function revalidateProjectViews() {
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/companies");
}

export async function createProject(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") || "").trim() || "New Engagement";
  const client = String(formData.get("client") || "").trim() || "—";
  const dueDateRaw = String(formData.get("dueDate") || "");
  const companyId = await findOrCreateCompanyId(client);

  await prisma.project.create({
    data: {
      name,
      client,
      companyId,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    },
  });
  revalidateProjectViews();
}

export async function deleteProject(projectId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAuth();
  try {
    await prisma.project.delete({ where: { id: projectId } });
  } catch {
    return { ok: false, error: "Couldn't delete this project. It may have already been removed." };
  }
  revalidateProjectViews();
  return { ok: true };
}

export async function updateProjectStatus(projectId: string, status: string) {
  await requireAuth();
  await prisma.project.update({ where: { id: projectId }, data: { status } });
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
