"use server";

import { requireAuth } from "@/lib/authGuard";
import { sendEmail as sendEmailRaw } from "@/lib/email";
import { renderCrmEmailHtml, type EmailKind } from "@/lib/emailTemplates";
import { prisma } from "@/lib/prisma";

// Sends a one-off email from the CRM (a quick note to a contact/lead, an
// invoice or quote summary) and, when the send is tied to a Contact/Deal/
// Invoice, logs it as an activity note so there's a record of the outreach
// alongside everything else on that record. Leads have no activity feed,
// so a lead send just isn't logged anywhere beyond Resend's own history.
export async function sendCrmEmail(params: {
  to: string;
  subject: string;
  message: string;
  contactId?: string;
  dealId?: string;
  invoiceId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAuth();
  const to = params.to.trim();
  const subject = params.subject.trim();
  const message = params.message.trim();
  if (!to || !subject || !message) {
    return { ok: false, error: "To, subject, and message are all required." };
  }

  const kind: EmailKind = params.invoiceId ? "invoice" : params.dealId ? "quote" : "note";
  const html = renderCrmEmailHtml({ kind, message });

  try {
    await sendEmailRaw({ to, subject, text: message, html });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Couldn't send this email.",
    };
  }

  const noteText = `Emailed ${to}: "${subject}"`;
  if (params.contactId) {
    await prisma.activity.create({ data: { contactId: params.contactId, text: noteText } });
  }
  if (params.dealId) {
    await prisma.activity.create({ data: { dealId: params.dealId, text: noteText } });
  }
  if (params.invoiceId) {
    await prisma.activity.create({ data: { invoiceId: params.invoiceId, text: noteText } });
  }

  return { ok: true };
}
