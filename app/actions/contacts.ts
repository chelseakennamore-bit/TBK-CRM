"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findOrCreateCompanyId } from "@/app/actions/companies";

export async function createContact(formData: FormData) {
  const name = String(formData.get("name") || "").trim() || "New contact";
  const company = String(formData.get("company") || "").trim() || "—";
  const title = String(formData.get("title") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const companyId = await findOrCreateCompanyId(company);

  await prisma.contact.create({
    data: { name, company, companyId, title, email, phone },
  });
  revalidatePath("/contacts");
  revalidatePath("/companies");
}

export async function addContactNote(contactId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await prisma.activity.create({ data: { contactId, text: trimmed } });
}
