"use server";

import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findOrCreateCompanyId } from "@/app/actions/companies";

function revalidateInvoiceViews() {
  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/companies");
}

export async function createInvoice(formData: FormData) {
  await requireAuth();
  const client = String(formData.get("client") || "").trim() || "—";
  const dealId = String(formData.get("dealId") || "").trim();
  const amount = Number(formData.get("amount")) || 0;
  const dueDateRaw = String(formData.get("dueDate") || "");
  const companyId = await findOrCreateCompanyId(client);

  const last = await prisma.invoice.findFirst({
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const invoiceNumber = (last?.invoiceNumber ?? 0) + 1;

  await prisma.invoice.create({
    data: {
      invoiceNumber,
      client,
      companyId,
      dealId: dealId || null,
      amount,
      status: "Draft",
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    },
  });
  revalidateInvoiceViews();
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  await requireAuth();
  if (status === "Paid") {
    // Stamp today's date only if one isn't already set, so re-saving
    // "Paid" doesn't overwrite a manually backdated payment date.
    await prisma.invoice.updateMany({
      where: { id: invoiceId, paidAt: null },
      data: { status, paidAt: new Date() },
    });
    await prisma.invoice.updateMany({
      where: { id: invoiceId, paidAt: { not: null } },
      data: { status },
    });
  } else {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status, paidAt: null },
    });
  }
  revalidateInvoiceViews();
}

export async function updateInvoiceDetails(
  invoiceId: string,
  data: {
    revenueStream?: string;
    notes?: string;
    paidAt?: string;
    dueDate?: string;
  }
) {
  await requireAuth();
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      ...(data.revenueStream !== undefined ? { revenueStream: data.revenueStream } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.paidAt !== undefined
        ? { paidAt: data.paidAt ? new Date(data.paidAt) : null }
        : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
        : {}),
    },
  });
  revalidateInvoiceViews();
}

export async function addInvoiceNote(invoiceId: string, text: string) {
  await requireAuth();
  const trimmed = text.trim();
  if (!trimmed) return;
  await prisma.activity.create({ data: { invoiceId, text: trimmed } });
}

export async function deleteInvoice(invoiceId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAuth();
  try {
    await prisma.invoice.delete({ where: { id: invoiceId } });
  } catch {
    return { ok: false, error: "Couldn't delete this invoice. It may have already been removed." };
  }
  revalidateInvoiceViews();
  return { ok: true };
}
