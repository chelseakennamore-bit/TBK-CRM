"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findOrCreateCompanyId } from "@/app/actions/companies";

function revalidateDealViews() {
  revalidatePath("/deals");
  revalidatePath("/");
  revalidatePath("/reports");
  revalidatePath("/invoices");
  revalidatePath("/companies");
}

export async function createDeal(formData: FormData) {
  const title = String(formData.get("title") || "").trim() || "New Engagement";
  const company = String(formData.get("company") || "").trim() || "—";
  const contactName = String(formData.get("contactName") || "").trim() || "—";
  const value = Number(formData.get("value")) || 0;
  const closeDateRaw = String(formData.get("closeDate") || "");
  const companyId = await findOrCreateCompanyId(company);

  await prisma.deal.create({
    data: {
      title,
      company,
      companyId,
      contactName,
      value,
      stage: "Lead",
      closeDate: closeDateRaw ? new Date(closeDateRaw) : null,
    },
  });
  revalidateDealViews();
}

export async function updateDealStage(dealId: string, stage: string) {
  await prisma.deal.update({
    where: { id: dealId },
    data: { stage, activities: { create: [{ text: `Stage changed to ${stage}` }] } },
  });
  revalidateDealViews();
}

export async function updateDealValue(dealId: string, value: number) {
  await prisma.deal.update({ where: { id: dealId }, data: { value } });
  revalidateDealViews();
}

export async function updateDealCloseDate(dealId: string, closeDate: string) {
  await prisma.deal.update({
    where: { id: dealId },
    data: { closeDate: closeDate ? new Date(closeDate) : null },
  });
  revalidatePath("/deals");
}

export async function updateDealNotes(dealId: string, notes: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { notes } });
  revalidatePath("/deals");
}

export async function addDealNote(dealId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await prisma.activity.create({ data: { dealId, text: trimmed } });
}

export async function addDealTask(dealId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await prisma.task.create({ data: { dealId, text: trimmed } });
}

export async function toggleDealTask(taskId: string, done: boolean) {
  await prisma.task.update({ where: { id: taskId }, data: { done } });
}
