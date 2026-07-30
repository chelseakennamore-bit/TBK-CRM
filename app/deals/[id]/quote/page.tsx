import { notFound } from "next/navigation";
import { Source_Serif_4 } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { ensureQuoteIssued } from "@/app/actions/deals";
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

export default async function DealQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      companyRecord: true,
      contactRecord: true,
      lineItems: { orderBy: { order: "asc" } },
    },
  });

  if (!deal) notFound();

  const quoteInfo = await ensureQuoteIssued(deal.id);
  const quoteNumber = quoteInfo?.quoteNumber ?? deal.quoteNumber ?? 0;
  const issuedAt = quoteInfo?.quoteIssuedAt ?? deal.quoteIssuedAt ?? new Date();
  const expiresAt = new Date(issuedAt.getTime() + 30 * 86400000);

  const isSubscription = deal.quoteType === "subscription";
  const heading = isSubscription ? "Subscription Quote" : "Service Quote";
  const sectionLabel = isSubscription ? "Subscription" : "Engagement";

  const companyName = deal.companyRecord?.name || deal.company;
  const contactName = deal.contactRecord?.name || deal.contactName;
  const contactEmail = deal.contactRecord?.email;

  const lineItems =
    deal.lineItems.length > 0
      ? deal.lineItems
      : [
          {
            id: "synthesized",
            description: deal.title,
            detail: deal.revenueStream,
            seats: null as number | null,
            unitPrice: null as number | null,
            amount: deal.value,
          },
        ];
  const subtotal = lineItems.reduce((a, i) => a + i.amount, 0);
  const total = subtotal;

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
        <LinkButton href="/deals">Back to deals</LinkButton>
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
            <h1 style={{ fontSize: 40, fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
              {heading}
            </h1>
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
              Quote #Q-{String(quoteNumber).padStart(6, "0")}
            </span>
          </div>

          {/* Quote info / customer */}
          <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 32 }}>
            <div>
              <div style={labelStyle}>Quote Information</div>
              <InfoRow label="Issue Date" value={longDate(issuedAt)} />
              <InfoRow label="Expires" value={longDate(expiresAt)} />
              {deal.closeDate && <InfoRow label="Start Date" value={longDate(deal.closeDate)} />}
            </div>
            <div>
              <div style={labelStyle}>Customer</div>
              <div style={{ marginTop: 12, fontWeight: 600, fontSize: 15 }}>{companyName}</div>
              <div style={{ marginTop: 6, fontSize: 15 }}>{contactName}</div>
              {contactEmail && (
                <div style={{ marginTop: 6, fontSize: 15, color: COLOR_MUTED }}>{contactEmail}</div>
              )}
            </div>
          </div>

          {/* Engagement / subscription */}
          <div style={{ marginTop: 56 }}>
            <div style={labelStyle}>{sectionLabel}</div>
            <h2 style={{ marginTop: 8, fontSize: 26, fontWeight: 600, lineHeight: 1.25 }}>
              {deal.title}
            </h2>
          </div>

          {/* Line items table */}
          <table style={{ width: "100%", marginTop: 24, borderCollapse: "collapse", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "auto" }} />
              {isSubscription && <col style={{ width: 70 }} />}
              <col style={{ width: isSubscription ? 110 : 160 }} />
              {isSubscription && <col style={{ width: 100 }} />}
              <col style={{ width: 100 }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLOR_RULE}` }}>
                <th style={{ ...labelStyle, textAlign: "left", paddingBottom: 10, fontWeight: 500 }}>
                  {isSubscription ? "Item" : "Deliverable"}
                </th>
                {isSubscription && (
                  <th style={{ ...labelStyle, textAlign: "right", paddingBottom: 10, fontWeight: 500 }}>
                    Seats
                  </th>
                )}
                <th style={{ ...labelStyle, textAlign: "left", paddingBottom: 10, paddingLeft: 20, fontWeight: 500 }}>
                  {isSubscription ? "Billing" : "Type"}
                </th>
                {isSubscription && (
                  <th style={{ ...labelStyle, textAlign: "right", paddingBottom: 10, fontWeight: 500 }}>
                    Unit Price
                  </th>
                )}
                <th style={{ ...labelStyle, textAlign: "right", paddingBottom: 10, fontWeight: 500 }}>
                  {isSubscription ? "Total" : "Amount"}
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${COLOR_RULE}` }}>
                  <td style={{ padding: "13px 0", fontSize: 15 }}>{item.description}</td>
                  {isSubscription && (
                    <td style={{ padding: "13px 0", fontSize: 15, textAlign: "right" }}>
                      {item.seats ?? "—"}
                    </td>
                  )}
                  <td style={{ padding: "13px 0", fontSize: 15, paddingLeft: 20 }}>
                    {item.detail || "—"}
                  </td>
                  {isSubscription && (
                    <td style={{ padding: "13px 0", fontSize: 15, textAlign: "right" }}>
                      {item.unitPrice != null ? money(item.unitPrice) : "—"}
                    </td>
                  )}
                  <td style={{ padding: "13px 0", fontSize: 15, textAlign: "right" }}>
                    {money(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            {isSubscription && (
              <div style={{ display: "flex", gap: 40, fontSize: 15, color: COLOR_MUTED }}>
                <span>Subtotal</span>
                <span style={{ minWidth: 90, textAlign: "right" }}>{money(subtotal)}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 40, alignItems: "baseline", marginTop: isSubscription ? 8 : 16 }}>
              <span style={{ fontSize: 21 }}>Total</span>
              <span style={{ minWidth: 90, textAlign: "right", fontSize: 21, fontWeight: 700, color: COLOR_ACCENT }}>
                {money(total)}
              </span>
            </div>
          </div>

          {/* Scope of work */}
          <div style={{ marginTop: 48 }}>
            <div style={labelStyle}>Scope of Work / Notes</div>
            <p style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
              {deal.scopeOfWork || "—"}
            </p>
          </div>

          {/* Payment terms */}
          <div style={{ marginTop: 28 }}>
            <div style={labelStyle}>Payment Terms</div>
            <p style={{ marginTop: 10, fontSize: 15 }}>{deal.paymentTerms}</p>
          </div>
        </div>

        {/* Disclaimer footer, pinned to bottom */}
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
          This quote does not constitute a binding agreement. See the attached agreement for full terms.
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
