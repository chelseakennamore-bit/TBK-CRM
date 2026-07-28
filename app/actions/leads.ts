"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateLeadViews() {
  revalidatePath("/leads");
  revalidatePath("/");
  revalidatePath("/reports");
}

export async function createLead(formData: FormData) {
  const name = String(formData.get("name") || "").trim() || "New contact";
  const company = String(formData.get("company") || "").trim() || "—";
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim() || "—";

  await prisma.lead.create({
    data: { name, company, email, message, source: "Manual entry", status: "new" },
  });
  revalidateLeadViews();
}

export async function importLeadsCsv(formData: FormData) {
  const text = String(formData.get("csvText") || "");
  const rows = text
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);

  const leads = rows.map((row) => {
    const [name, company, email, message, source] = row
      .split(",")
      .map((x) => (x || "").trim());
    return {
      name: name || "Unknown",
      company: company || "—",
      email: email || "",
      message: message || "—",
      source: source || "CSV import",
      status: "new",
    };
  });

  if (leads.length > 0) {
    await prisma.lead.createMany({ data: leads });
  }
  revalidateLeadViews();
}

export async function syncNow() {
  const next = await prisma.queuedLead.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (next) {
    await prisma.lead.create({
      data: {
        name: next.name,
        company: next.company,
        email: next.email,
        message: next.message,
        source: next.source,
        status: "new",
      },
    });
    await prisma.queuedLead.delete({ where: { id: next.id } });
  }

  const now = new Date().toISOString();
  await prisma.setting.upsert({
    where: { key: "lastSyncedAt" },
    update: { value: now },
    create: { key: "lastSyncedAt", value: now },
  });
  revalidateLeadViews();
}

export async function convertLead(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: { status: "in_pipeline" },
    }),
    prisma.deal.create({
      data: {
        title: "New Engagement",
        company: lead.company,
        contactName: lead.name,
        value: 0,
        stage: "Lead",
        notes: `Converted from inbound lead: ${lead.message}`,
        activities: { create: [{ text: "Converted from inbound lead" }] },
      },
    }),
  ]);

  revalidateLeadViews();
  revalidatePath("/deals");
  redirect("/deals");
}
