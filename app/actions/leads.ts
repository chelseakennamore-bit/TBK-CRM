"use server";

import { requireAuth } from "@/lib/authGuard";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { fetchSheetTab, rowsToObjects } from "@/lib/googleSheets";
import { notifyNewLead } from "@/lib/webhooks";
import { findOrCreateCompanyId } from "@/app/actions/companies";
import { findOrCreateContactId } from "@/app/actions/contacts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateLeadViews() {
  revalidatePath("/leads");
  revalidatePath("/");
  revalidatePath("/reports");
}

export async function createLead(formData: FormData) {
  const session = await requireAuth();
  const name = String(formData.get("name") || "").trim() || "New contact";
  const company = String(formData.get("company") || "").trim() || "—";
  const email = String(formData.get("email") || "").trim();
  const message = String(formData.get("message") || "").trim() || "—";

  const lead = await prisma.lead.create({
    data: { name, company, email, message, source: "Manual entry", status: "new" },
  });
  await logAudit(session, {
    action: "create",
    entityType: "Lead",
    entityId: lead.id,
    entityLabel: lead.name,
  });
  revalidateLeadViews();
  await notifyNewLead(lead);
}

export async function updateLeadFollowUp(leadId: string, nextFollowUpAt: string) {
  await requireAuth();
  await prisma.lead.update({
    where: { id: leadId },
    data: { nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null },
  });
  revalidatePath("/leads");
  revalidatePath("/");
}

export async function importLeadsCsv(formData: FormData) {
  const session = await requireAuth();
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
    const created = await prisma.lead.createManyAndReturn({ data: leads });
    await logAudit(session, {
      action: "create",
      entityType: "Lead",
      entityId: "bulk",
      entityLabel: `${created.length} lead${created.length === 1 ? "" : "s"}`,
      detail: "Imported via CSV",
    });
    revalidateLeadViews();
    for (const lead of created) {
      await notifyNewLead(lead);
    }
    return;
  }
  revalidateLeadViews();
}

type SheetLead = {
  name: string;
  company: string;
  email: string;
  message: string;
};

type SheetTabConfig = {
  tab: string;
  sourceLabel: string;
  mapRow: (row: Record<string, string>) => SheetLead | null;
};

// Maps the two intake tabs in the "TBK Contacts and Leads" sheet to Lead
// fields. Column names come from the sheet's header row, so this stays
// correct even if columns get reordered (but breaks if a header is renamed).
const SHEET_TABS: SheetTabConfig[] = [
  {
    tab: "Contact",
    sourceLabel: "Website contact form",
    mapRow: (row) => {
      if (!row.email && !row.name) return null;
      return {
        name: row.name || "Unknown",
        company: row.Company || "—",
        email: row.email || "",
        message: row.message || "—",
      };
    },
  },
  {
    tab: "Leads",
    sourceLabel: "Website resource download",
    mapRow: (row) => {
      if (!row.email && !row.name) return null;
      const resource = row.resource ? `Requested "${row.resource}"` : "Resource download inquiry";
      const challenge = row.challenge ? ` — ${row.challenge}` : "";
      return {
        name: row.name || "Unknown",
        company: row.business || "—",
        email: row.email || "",
        message: `${resource}${challenge}`,
      };
    },
  },
];

function parseSheetTimestamp(raw: string): Date {
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function syncNow(): Promise<{ importedCount: number }> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured.");
  }

  const candidates: Array<{
    name: string;
    company: string;
    email: string;
    message: string;
    source: string;
    receivedAt: Date;
    status: string;
    sourceRef: string;
  }> = [];

  for (const config of SHEET_TABS) {
    const values = await fetchSheetTab(spreadsheetId, config.tab);
    for (const row of rowsToObjects(values)) {
      const mapped = config.mapRow(row);
      if (!mapped) continue;
      const timestamp = row.timestamp || "";
      const sourceRef = `${config.tab}:${timestamp}:${mapped.email || mapped.name}`;
      candidates.push({
        ...mapped,
        source: row.Source || config.sourceLabel,
        receivedAt: timestamp ? parseSheetTimestamp(timestamp) : new Date(),
        status: "new",
        sourceRef,
      });
    }
  }

  const created = candidates.length
    ? await prisma.lead.createManyAndReturn({ data: candidates, skipDuplicates: true })
    : [];

  const now = new Date().toISOString();
  await prisma.setting.upsert({
    where: { key: "lastSyncedAt" },
    update: { value: now },
    create: { key: "lastSyncedAt", value: now },
  });
  revalidateLeadViews();

  for (const lead of created) {
    await notifyNewLead(lead);
  }

  return { importedCount: created.length };
}

export async function deleteLead(leadId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAuth();
  let lead;
  try {
    lead = await prisma.lead.delete({ where: { id: leadId } });
  } catch {
    return { ok: false, error: "Couldn't delete this lead. It may have already been removed." };
  }
  await logAudit(session, {
    action: "delete",
    entityType: "Lead",
    entityId: lead.id,
    entityLabel: lead.name,
  });
  revalidateLeadViews();
  return { ok: true };
}

export async function convertLead(leadId: string) {
  const session = await requireAuth();
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  const companyId = await findOrCreateCompanyId(lead.company);
  const contactId = await findOrCreateContactId(
    lead.name,
    lead.company,
    lead.email,
    companyId
  );

  const [, deal] = await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: { status: "in_pipeline" },
    }),
    prisma.deal.create({
      data: {
        title: "New Engagement",
        company: lead.company,
        companyId,
        contactName: lead.name,
        contactId,
        value: 0,
        stage: "Lead",
        notes: `Converted from inbound lead: ${lead.message}`,
        activities: { create: [{ text: "Converted from inbound lead", source: "system" }] },
      },
    }),
  ]);

  await logAudit(session, {
    action: "status_change",
    entityType: "Lead",
    entityId: lead.id,
    entityLabel: lead.name,
    detail: "Converted to deal",
  });
  await logAudit(session, {
    action: "create",
    entityType: "Deal",
    entityId: deal.id,
    entityLabel: deal.title,
    detail: `From converted lead "${lead.name}"`,
  });

  revalidateLeadViews();
  revalidatePath("/deals");
  revalidatePath("/companies");
  revalidatePath("/contacts");
  redirect("/deals");
}
