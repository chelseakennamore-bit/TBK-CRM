"use server";

import { requireAuth } from "@/lib/authGuard";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Finds an existing Company by case-insensitive name match, or creates one.
// Returns null for blank/placeholder names ("no company" isn't a company).
export async function findOrCreateCompanyId(nameRaw: string): Promise<string | null> {
  await requireAuth();
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
  await requireAuth();
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

export async function deleteCompany(companyId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAuth();
  const [contactCount, dealCount, projectCount, invoiceCount] = await Promise.all([
    prisma.contact.count({ where: { companyId } }),
    prisma.deal.count({ where: { companyId } }),
    prisma.project.count({ where: { companyId } }),
    prisma.invoice.count({ where: { companyId } }),
  ]);
  const parts: string[] = [];
  if (contactCount) parts.push(`${contactCount} contact${contactCount === 1 ? "" : "s"}`);
  if (dealCount) parts.push(`${dealCount} deal${dealCount === 1 ? "" : "s"}`);
  if (projectCount) parts.push(`${projectCount} project${projectCount === 1 ? "" : "s"}`);
  if (invoiceCount) parts.push(`${invoiceCount} invoice${invoiceCount === 1 ? "" : "s"}`);
  if (parts.length > 0) {
    return {
      ok: false,
      error: `Can't delete this company -- it still has ${parts.join(", ")}. Remove those first.`,
    };
  }

  try {
    await prisma.company.delete({ where: { id: companyId } });
  } catch {
    return { ok: false, error: "Couldn't delete this company. It may have already been removed." };
  }
  revalidatePath("/companies");
  return { ok: true };
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
  await requireAuth();
  await prisma.company.update({ where: { id: companyId }, data });
  revalidatePath("/companies");
}
