import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LinkButton, Tag } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { money, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DealQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: { companyRecord: true, contactRecord: true },
  });

  if (!deal) notFound();

  const companyName = deal.companyRecord?.name || deal.company;
  const contactName = deal.contactRecord?.name || deal.contactName;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 print:max-w-none print:p-0">
      <style>{`
        @media print {
          html, body {
            background: #ffffff !important;
          }
          .quote-doc, .quote-doc * {
            color: #18181b !important;
            background: #ffffff !important;
            border-color: #e4e4e7 !important;
          }
        }
      `}</style>
      <div className="mb-8 flex items-center justify-between print:hidden">
        <LinkButton href="/deals">Back to deals</LinkButton>
        <PrintButton />
      </div>

      <div className="quote-doc rounded-xl border border-zinc-200 bg-white p-10 dark:border-zinc-800 dark:bg-zinc-900 print:rounded-none print:border-0 print:p-0">
        <header className="mb-10 flex items-start justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <div>
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              TBK Enterprise Consulting
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Engagement Quote
            </div>
          </div>
          <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
            {fmtDate(new Date())}
          </div>
        </header>

        <div className="mb-10 grid grid-cols-2 gap-8">
          <div>
            <div className="mb-1 text-xs font-medium tracking-wide text-zinc-400 uppercase">
              Prepared for
            </div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-50">
              {companyName}
            </div>
            {deal.companyRecord?.website && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {deal.companyRecord.website}
              </div>
            )}
          </div>
          <div>
            <div className="mb-1 text-xs font-medium tracking-wide text-zinc-400 uppercase">
              Contact
            </div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-50">
              {contactName}
            </div>
            {deal.contactRecord?.title && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {deal.contactRecord.title}
              </div>
            )}
            {deal.contactRecord?.email && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {deal.contactRecord.email}
              </div>
            )}
            {deal.contactRecord?.phone && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {deal.contactRecord.phone}
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {deal.title}
          </h1>
          {deal.revenueStream && (
            <Tag variant="accent" className="mt-2">
              {deal.revenueStream}
            </Tag>
          )}
        </div>

        <div className="mb-10">
          <div className="mb-2 text-xs font-medium tracking-wide text-zinc-400 uppercase">
            Scope of work
          </div>
          <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {deal.notes || "—"}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <div className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
            Investment
          </div>
          <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {money(deal.value)}
          </div>
        </div>
      </div>
    </div>
  );
}
