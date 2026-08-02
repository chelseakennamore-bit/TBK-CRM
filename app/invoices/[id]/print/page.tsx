import { notFound } from "next/navigation";
import { Source_Serif_4 } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { LinkButton } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const PAGE_WIDTH = 816;
const PAGE_HEIGHT = 1056;

const COLOR_TEXT = "#201e1d";
const COLOR_BG = "#f3f2f2";
const COLOR_MUTED = "#83807d";
const COLOR_RULE = "#dddbd9";
const COLOR_ACCENT = "#0088b0";
const COLOR_ACCENT_BG = "#dcedf1";
const COLOR_PAID = "#1a8a4a";
const COLOR_PAID_BG = "#dcf1e4";

function longDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: COLOR_MUTED,
};

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      companyRecord: true,
      deal: { include: { contactRecord: true } },
    },
  });

  if (!invoice) notFound();

  const isPaid = invoice.status === "Paid";
  const billToName = invoice.companyRecord?.name || invoice.client;
  const contactName = invoice.deal?.contactRecord?.name;
  const contactEmail = invoice.deal?.contactRecord?.email;
  const paymentTerms = invoice.deal?.paymentTerms || "Net 30 from invoice date";

  // Always a single line for the exact invoiced amount -- deriving a
  // breakdown from the linked deal's line items risks a total that
  // doesn't match invoice.amount (e.g. this invoice covers a partial
  // milestone of a larger deal), which would be wrong on an actual
  // invoice document.
  const lineDescription = invoice.deal?.title || invoice.revenueStream || "Professional services";
  const lineDetail = invoice.revenueStream || "—";

  return (
    <div
      className="mx-auto px-6 py-10 print:p-0"
      style={{ maxWidth: PAGE_WIDTH + 48 }}
    >
      <style>{`
        @media print {
          @page { size: letter; margin: 0; }
          html, body { background: #ffffff !important; }
        }
      `}</style>

      <div className="mb-8 flex items-center justify-between print:hidden">
        <LinkButton href="/invoices">Back to invoices</LinkButton>
        <PrintButton />
      </div>

      <div
        className={sourceSerif.className}
        style={{
          position: "relative",
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          background: COLOR_BG,
          color: COLOR_TEXT,
          margin: "0 auto",
        }}
      >
        <div style={{ padding: "56px 64px 0" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={labelStyle}>TBK Enterprise Consulting</div>
              <h1 style={{ fontSize: 40, fontWeight: 700, margin: "6px 0 0", lineHeight: 1.1 }}>
                Invoice
              </h1>
            </div>
            {isPaid ? (
              <span
                style={{
                  background: COLOR_PAID_BG,
                  color: COLOR_PAID,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "7px 14px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Paid
              </span>
            ) : (
              <span
                style={{
                  background: COLOR_ACCENT_BG,
                  color: COLOR_ACCENT,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "7px 14px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                }}
              >
                Invoice #{String(invoice.invoiceNumber ?? 0).padStart(6, "0")}
              </span>
            )}
          </div>

          {/* Invoice info / bill to */}
          <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 32 }}>
            <div>
              <div style={labelStyle}>Invoice Information</div>
              <InfoRow label="Invoice #" value={String(invoice.invoiceNumber ?? 0).padStart(6, "0")} />
              <InfoRow label="Issue Date" value={longDate(invoice.issuedAt)} />
              <InfoRow label="Due Date" value={longDate(invoice.dueDate)} />
              {isPaid && invoice.paidAt && <InfoRow label="Paid On" value={longDate(invoice.paidAt)} />}
            </div>
            <div>
              <div style={labelStyle}>Bill To</div>
              <div style={{ marginTop: 12, fontWeight: 600, fontSize: 15 }}>{billToName}</div>
              {contactName && <div style={{ marginTop: 6, fontSize: 15 }}>{contactName}</div>}
              {contactEmail && (
                <div style={{ marginTop: 6, fontSize: 15, color: COLOR_MUTED }}>{contactEmail}</div>
              )}
            </div>
          </div>

          {/* Line items table */}
          <table style={{ width: "100%", marginTop: 56, borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "auto" }} />
              <col style={{ width: 160 }} />
              <col style={{ width: 100 }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLOR_RULE}` }}>
                <th style={{ ...labelStyle, textAlign: "left", paddingBottom: 10, fontWeight: 500 }}>
                  Description
                </th>
                <th style={{ ...labelStyle, textAlign: "left", paddingBottom: 10, paddingLeft: 20, fontWeight: 500 }}>
                  Category
                </th>
                <th style={{ ...labelStyle, textAlign: "right", paddingBottom: 10, fontWeight: 500 }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${COLOR_RULE}` }}>
                <td style={{ padding: "13px 0", fontSize: 15 }}>{lineDescription}</td>
                <td style={{ padding: "13px 0", fontSize: 15, paddingLeft: 20 }}>{lineDetail}</td>
                <td style={{ padding: "13px 0", fontSize: 15, textAlign: "right" }}>
                  {money(invoice.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total */}
          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", gap: 40, alignItems: "baseline", marginTop: 16 }}>
              <span style={{ fontSize: 21 }}>{isPaid ? "Total Paid" : "Amount Due"}</span>
              <span
                style={{
                  minWidth: 90,
                  textAlign: "right",
                  fontSize: 21,
                  fontWeight: 700,
                  color: isPaid ? COLOR_PAID : COLOR_ACCENT,
                }}
              >
                {money(invoice.amount)}
              </span>
            </div>
          </div>

          {/* Payment terms */}
          <div style={{ marginTop: 48 }}>
            <div style={labelStyle}>Payment Terms</div>
            <p style={{ marginTop: 10, fontSize: 15 }}>{paymentTerms}</p>
          </div>

          {invoice.notes && (
            <div style={{ marginTop: 28 }}>
              <div style={labelStyle}>Notes</div>
              <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {invoice.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer, pinned to bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 12,
            color: COLOR_MUTED,
          }}
        >
          Thank you for your business. Please remit payment by the due date above.
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 15 }}>
      <span style={{ color: COLOR_MUTED, minWidth: 72 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
