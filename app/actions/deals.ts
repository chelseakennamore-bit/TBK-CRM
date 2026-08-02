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
  const contactId = String(formData.get("contactId") || "").trim() || null;
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
      contactId,
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
  const deal = await prisma.deal.update({
    where: { id: dealId },
    data: {
      stage,
      probability: STAGE_PROBABILITY[stage] ?? 0,
      activities: { create: [{ text: `Stage changed to ${stage}` }] },
    },
  });

  if (stage === "Won") {
    const existingProject = await prisma.project.findFirst({
      where: { dealId },
      select: { id: true },
    });
    if (!existingProject) {
      await prisma.project.create({
        data: {
          name: deal.title,
          client: deal.company,
          companyId: deal.companyId,
          contactId: deal.contactId,
          contractedValue: deal.value,
          notes: deal.scopeOfWork,
          dealId: deal.id,
          activities: {
            create: [{ text: "Created automatically when the deal closed", source: "system" }],
          },
        },
      });
      revalidatePath("/projects");
    }
  }

  revalidateDealViews();
}

export async function deleteDeal(dealId: string): Promise<{ ok: boolean; error?: string }> {
  const [projectCount, invoiceCount] = await Promise.all([
    prisma.project.count({ where: { dealId } }),
    prisma.invoice.count({ where: { dealId } }),
  ]);
  const parts: string[] = [];
  if (projectCount) parts.push(`${projectCount} project${projectCount === 1 ? "" : "s"}`);
  if (invoiceCount) parts.push(`${invoiceCount} invoice${invoiceCount === 1 ? "" : "s"}`);
  if (parts.length > 0) {
    return {
      ok: false,
      error: `Can't delete this deal -- it still has ${parts.join(" and ")} linked to it. Remove those first.`,
    };
  }

  try {
    await prisma.deal.delete({ where: { id: dealId } });
  } catch {
    return { ok: false, error: "Couldn't delete this deal. It may have already been removed." };
  }
  revalidateDealViews();
  return { ok: true };
}

export async function updateDealTitle(dealId: string, title: string) {
  const trimmed = title.trim();
  await prisma.deal.update({
    where: { id: dealId },
    data: { title: trimmed || "New Engagement" },
  });
  revalidateDealViews();
}

export async function updateDealCompany(dealId: string, company: string) {
  const trimmed = company.trim() || "—";
  const companyId = await findOrCreateCompanyId(trimmed);
  await prisma.deal.update({
    where: { id: dealId },
    data: { company: trimmed, companyId },
  });
  revalidateDealViews();
}

export async function updateDealContact(
  dealId: string,
  contactId: string,
  contactName: string
) {
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      contactId: contactId || null,
      contactName: contactName.trim() || "—",
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

export async function updateDealScopeOfWork(dealId: string, scopeOfWork: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { scopeOfWork } });
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

export async function updateDealQuoteType(dealId: string, quoteType: string) {
  await prisma.deal.update({ where: { id: dealId }, data: { quoteType } });
  revalidatePath("/deals");
}

export async function updateDealQuoteProductName(dealId: string, quoteProductName: string) {
  await prisma.deal.update({
    where: { id: dealId },
    data: { quoteProductName: quoteProductName.trim() },
  });
  revalidatePath("/deals");
}

export async function updateDealPaymentTerms(dealId: string, paymentTerms: string) {
  await prisma.deal.update({
    where: { id: dealId },
    data: { paymentTerms: paymentTerms.trim() || "Net 30 from invoice date" },
  });
  revalidatePath("/deals");
}

// Assigns a permanent, sequential quote number and issue date the first
// time a deal's quote is viewed, so reprints stay stable. A no-op if
// already assigned.
export async function ensureQuoteIssued(dealId: string) {
  return prisma.$transaction(async (tx) => {
    const deal = await tx.deal.findUnique({
      where: { id: dealId },
      select: { quoteNumber: true, quoteIssuedAt: true },
    });
    if (!deal || deal.quoteNumber !== null) return deal;

    const last = await tx.deal.findFirst({
      where: { quoteNumber: { not: null } },
      orderBy: { quoteNumber: "desc" },
      select: { quoteNumber: true },
    });
    const quoteNumber = (last?.quoteNumber ?? 0) + 1;
    return tx.deal.update({
      where: { id: dealId },
      data: { quoteNumber, quoteIssuedAt: new Date() },
      select: { quoteNumber: true, quoteIssuedAt: true },
    });
  });
}

export async function addQuoteLineItem(
  dealId: string,
  data: {
    description: string;
    detail: string;
    seats: number | null;
    unitPrice: number | null;
    amount: number;
  }
) {
  const description = data.description.trim();
  if (!description) return null;
  const item = await prisma.quoteLineItem.create({
    data: {
      dealId,
      description,
      detail: data.detail.trim(),
      seats: data.seats,
      unitPrice: data.unitPrice,
      amount: data.amount || 0,
    },
  });
  revalidatePath("/deals");
  return item;
}

export async function deleteQuoteLineItem(lineItemId: string) {
  await prisma.quoteLineItem.delete({ where: { id: lineItemId } });
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
