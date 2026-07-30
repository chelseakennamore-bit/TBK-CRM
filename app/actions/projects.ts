"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") || "").trim() || "New Engagement";
  const client = String(formData.get("client") || "").trim() || "—";
  const dueDateRaw = String(formData.get("dueDate") || "");

  await prisma.project.create({
    data: {
      name,
      client,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    },
  });
  revalidatePath("/projects");
}

export async function updateProjectStatus(projectId: string, status: string) {
  await prisma.project.update({ where: { id: projectId }, data: { status } });
  revalidatePath("/projects");
}

export async function updateProjectDetails(
  projectId: string,
  data: { health?: string; nextDeliverable?: string; nextMeetingAt?: string }
) {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.health !== undefined ? { health: data.health } : {}),
      ...(data.nextDeliverable !== undefined ? { nextDeliverable: data.nextDeliverable } : {}),
      ...(data.nextMeetingAt !== undefined
        ? { nextMeetingAt: data.nextMeetingAt ? new Date(data.nextMeetingAt) : null }
        : {}),
    },
  });
  revalidatePath("/projects");
  revalidatePath("/");
}

export async function addSubtask(
  projectId: string,
  text: string,
  dueDate: string
) {
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
  await prisma.subtask.update({ where: { id: subtaskId }, data: { done } });
  revalidatePath("/projects");
}
