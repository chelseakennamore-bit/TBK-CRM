"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findOrCreateCompanyId } from "@/app/actions/companies";
import { STAGE_PROBABILITY } from "@/lib/constants";

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
  const revenueStream = String(formData.get("revenueStream") || "").trim();
  const companyId = await findOrCreateCompanyId(company);

  await prisma.deal.create({
    data: {
      title,
      company,
      companyId,
      contactName,
      value,
      revenueStream,
      stage: "Lead",
      probability: STAGE_PROBABILITY["Lead"] ?? 0,
      closeDate: closeDateRaw ? new Date(closeDateRaw) : null,
    },
  });
  revalidateDealViews();
}

export async function updateDealStage(dealId: string, stage: string) {
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      stage,
      probability: STAGE_PROBABILITY[stage] ?? 0,
      activities: { create: [{ text: `Stage changed to ${stage}` }] },
    },
  });
  revalidateDealViews();
}

export async function updateDealProbability(dealId: string, probability: number) {
  const clamped = Math.max(0, Math.min(100, Math.round(probability) || 0));
  await prisma.deal.update({ where: { id: dealId }, data: { probability: clamped } });
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

export async function updateDealNextStep(
  dealId: string,
  nextStep: string,
  nextStepDueAt: string
) {
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      nextStep: nextStep.trim(),
      nextStepDueAt: nextStepDueAt ? new Date(nextStepDueAt) : null,
    },
  });
  revalidatePath("/deals");
  revalidatePath("/");
}

export async function updateDealRevenueStream(dealId: string, revenueStream: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { revenueStream } });
  revalidatePath("/deals");
  revalidatePath("/reports");
}

export async function updateDealClosedLostReason(dealId: string, reason: string) {
  await prisma.deal.update({
    where: { id: dealId },
    data: { closedLostReason: reason.trim() },
  });
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
