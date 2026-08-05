import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (client) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  client = new Resend(apiKey);
  return client;
}

// Sends an outbound email. Used for one-off sends triggered by a person
// (quick note to a lead, an invoice/quote summary) -- unlike
// lib/webhooks.ts's fire-and-forget notifyNewLead, this throws on failure
// so the caller can surface it to whoever clicked "Send". `html` is
// optional so callers without a rendered template still work with a
// plain-text-only send.
export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const resend = getClient();
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: params.subject,
    text: params.text,
    ...(params.html ? { html: params.html } : {}),
  });
  if (error) {
    throw new Error(error.message);
  }
}
