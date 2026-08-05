// Branded HTML wrapper for outbound CRM emails, styled to match the
// printable invoice/quote pages (app/invoices/[id]/print, app/deals/[id]/quote)
// so an emailed note, invoice, or quote looks like it came from the same
// business rather than a bare-text system message.

const COLOR_TEXT = "#201e1d";
const COLOR_BG = "#f3f2f2";
const COLOR_MUTED = "#83807d";
const COLOR_ACCENT = "#0088b0";
const COLOR_ACCENT_BG = "#dcedf1";

export type EmailKind = "invoice" | "quote" | "note";

const KIND_LABEL: Record<EmailKind, string> = {
  invoice: "Invoice",
  quote: "Quote",
  note: "",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Blank-line-separated paragraphs, preserving single line breaks within one.
function messageToHtml(message: string): string {
  return message
    .split(/\n{2,}/)
    .map(
      (para) =>
        `<p style="margin:0 0 16px;">${escapeHtml(para).replace(/\n/g, "<br />")}</p>`
    )
    .join("");
}

export function renderCrmEmailHtml(params: { kind: EmailKind; message: string }): string {
  const label = KIND_LABEL[params.kind];
  const badge = label
    ? `<div style="margin-bottom:20px;"><span style="display:inline-block;background:${COLOR_ACCENT_BG};color:${COLOR_ACCENT};font-size:12px;font-weight:600;padding:5px 12px;border-radius:6px;letter-spacing:0.02em;">${label}</span></div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:${COLOR_BG};font-family:Georgia,'Times New Roman',serif;color:${COLOR_TEXT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
      <tr>
        <td style="padding-bottom:20px;">
          <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${COLOR_MUTED};">
            TBK Enterprise Consulting
          </div>
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;border-radius:8px;padding:40px;">
          ${badge}<div style="font-size:15px;line-height:1.6;">${messageToHtml(params.message)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding-top:24px;text-align:center;font-size:12px;color:${COLOR_MUTED};">
          TBK Enterprise Consulting
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
