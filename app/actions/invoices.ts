"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findOrCreateCompanyId } from "@/app/actions/companies";

export async function createInvoice(formData: FormData) {
  const client = String(formData.get("client") || "").trim() || "—";
  const dealId = String(formData.get("dealId") || "").trim();
  const amount = Number(formData.get("amount")) || 0;
  const dueDateRaw = String(formData.get("dueDate") || "");
  const companyId = await findOrCreateCompanyId(client);

  await prisma.invoice.create({
    data: {
      client,
      companyId,
      dealId: dealId || null,
      amount,
      status: "Draft",
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    },
  });
  revalidatePath("/invoices");
  revalidatePath("/companies");
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
  revalidatePath("/invoices");
}

export async function deleteInvoice(invoiceId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.invoice.delete({ where: { id: invoiceId } });
  } catch {
    return { ok: false, error: "Couldn't delete this invoice. It may have already been removed." };
  }
  revalidatePath("/invoices");
  revalidatePath("/companies");
  return { ok: true };
}
