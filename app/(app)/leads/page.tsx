import { prisma } from "@/lib/prisma";
import { LinkButton, PageHeader, Tag } from "@/components/ui";
import { AddLeadModal } from "@/components/modals/AddLeadModal";
import { ImportCsvModal } from "@/components/modals/ImportCsvModal";
import { SyncNowButton } from "./SyncNowButton";
import { LeadsTable } from "./LeadsTable";
import { daysAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const [leads, lastSynced] = await Promise.all([
    prisma.lead.findMany({ orderBy: { receivedAt: "desc" } }),
    prisma.setting.findUnique({ where: { key: "lastSyncedAt" } }),
  ]);

  const lastSyncedLabel = lastSynced
    ? daysAgo(lastSynced.value) === "today"
      ? "moments ago"
      : daysAgo(lastSynced.value)
    : "never";

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Inbound inquiries from your website and manual entry"
        action={<AddLeadModal />}
      />
      <div className="mb-4 flex items-center gap-3">
        <Tag variant="accent">Synced from Google Sheet</Tag>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Last synced {lastSyncedLabel}
        </div>
        <div className="ml-auto flex gap-2">
          <LinkButton href="/api/export/leads">Export CSV</LinkButton>
          <ImportCsvModal />
          <SyncNowButton />
        </div>
      </div>
      <LeadsTable
        key={leads.map((l) => l.id).join(",")}
        leads={leads.map((l) => ({
          id: l.id,
          name: l.name,
          company: l.company,
          email: l.email,
          message: l.message,
          source: l.source,
          receivedAt: l.receivedAt.toISOString(),
          status: l.status,
          nextFollowUpAt: l.nextFollowUpAt ? l.nextFollowUpAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
