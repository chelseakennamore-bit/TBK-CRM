"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createInvoice(formData: FormData) {
  const client = String(formData.get("client") || "").trim() || "—";
  const dealId = String(formData.get("dealId") || "").trim();
  const amount = Number(formData.get("amount")) || 0;
  const dueDateRaw = String(formData.get("dueDate") || "");

  await prisma.invoice.create({
    data: {
      client,
      dealId: dealId || null,
      amount,
      status: "Draft",
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    },
  });
  revalidatePath("/invoices");
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
  revalidatePath("/invoices");
}
