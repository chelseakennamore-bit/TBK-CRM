"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Finds an existing Company by case-insensitive name match, or creates one.
// Returns null for blank/placeholder names ("no company" isn't a company).
export async function findOrCreateCompanyId(nameRaw: string): Promise<string | null> {
  const name = nameRaw.trim();
  if (!name || name === "—") return null;

  const existing = await prisma.company.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.company.create({ data: { name }, select: { id: true } });
  return created.id;
}

export async function createCompany(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  const website = String(formData.get("website") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const industry = String(formData.get("industry") || "").trim();
  const companySize = String(formData.get("companySize") || "").trim();
  const icpTier = String(formData.get("icpTier") || "").trim();
  const governmentContractor = formData.get("governmentContractor") === "on";

  await prisma.company.create({
    data: { name, website, notes, industry, companySize, icpTier, governmentContractor },
  });
  revalidatePath("/companies");
}

export async function updateCompanyDetails(
  companyId: string,
  data: {
    website?: string;
    notes?: string;
    industry?: string;
    companySize?: string;
    icpTier?: string;
    governmentContractor?: boolean;
  }
) {
  await prisma.company.update({ where: { id: companyId }, data });
  revalidatePath("/companies");
}
