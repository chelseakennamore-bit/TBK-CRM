// Optional outbound notification hook, e.g. for Zapier/Make/n8n or a future
// agent. No-ops until LEAD_WEBHOOK_URL is set. Never throws — a broken or
// slow webhook must never block lead creation.
export async function notifyNewLead(lead: {
  id: string;
  name: string;
  company: string;
  email: string;
  message: string;
  source: string;
}) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "lead.created", lead }),
      signal: controller.signal,
    });
  } catch (err) {
    console.error("[webhook] lead.created delivery failed:", err);
  } finally {
    clearTimeout(timeout);
  }
}
