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

export async function updateContactFollowUp(contactId: string, nextFollowUpAt: string) {
  await prisma.contact.update({
    where: { id: contactId },
    data: { nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null },
  });
  revalidatePath("/contacts");
  revalidatePath("/");
}

export async function updateContactMarketingConsent(
  contactId: string,
  marketingConsent: boolean
) {
  await prisma.contact.update({ where: { id: contactId }, data: { marketingConsent } });
  revalidatePath("/contacts");
}

export async function updateContactDetails(
  contactId: string,
  data: { name: string; company: string; title: string; email: string; phone: string }
) {
  const name = data.name.trim() || "New contact";
  const company = data.company.trim() || "—";
  const companyId = await findOrCreateCompanyId(company);

  await prisma.contact.update({
    where: { id: contactId },
    data: {
      name,
      company,
      companyId,
      title: data.title.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
    },
  });
  revalidatePath("/contacts");
  revalidatePath("/companies");
}

// Non-blocking helper for the Add Contact form: surfaces a matching
// existing contact by email so the user can decide whether to proceed,
// without hard-blocking submission.
export async function findContactByEmail(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return null;
  return prisma.contact.findFirst({
    where: { email: { equals: trimmed, mode: "insensitive" } },
    select: { id: true, name: true, company: true },
  });
}

// Finds an existing Contact by case-insensitive email match, or creates
// one. Used when converting a lead so the inquiry becomes a real,
// linked Contact instead of just free-text on the resulting deal. Leads
// without an email always create a new contact (nothing reliable to
// match on).
export async function findOrCreateContactId(
  name: string,
  company: string,
  email: string,
  companyId: string | null
): Promise<string> {
  const trimmedEmail = email.trim();
  if (trimmedEmail) {
    const existing = await prisma.contact.findFirst({
      where: { email: { equals: trimmedEmail, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  const created = await prisma.contact.create({
    data: {
      name: name.trim() || "New contact",
      company: company.trim() || "—",
      companyId,
      email: trimmedEmail,
      title: "",
      phone: "",
    },
    select: { id: true },
  });
  revalidatePath("/contacts");
  return created.id;
}
