import { prisma } from "@/lib/prisma";
import { LinkButton, PageHeader, Table, Th, Td, Tag } from "@/components/ui";
import { AddLeadModal } from "@/components/modals/AddLeadModal";
import { ImportCsvModal } from "@/components/modals/ImportCsvModal";
import { SyncNowButton } from "./SyncNowButton";
import { ConvertButton } from "./ConvertButton";
import { LeadFollowUpDate } from "./LeadFollowUpDate";
import { DeleteButton } from "@/components/DeleteButton";
import { SendEmailModal } from "@/components/modals/SendEmailModal";
import { deleteLead } from "@/app/actions/leads";
import { daysAgo, toDateInputValue } from "@/lib/format";

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
      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Company</Th>
            <Th>Inquiry</Th>
            <Th>Source</Th>
            <Th>Received</Th>
            <Th>Status</Th>
            <Th>Follow-up</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
                {lead.name}
              </Td>
              <Td>{lead.company}</Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {lead.message}
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {lead.source}
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {daysAgo(lead.receivedAt)}
              </Td>
              <Td>
                <Tag variant={lead.status === "new" ? "accent" : "neutral"}>
                  {lead.status === "new" ? "New" : "In pipeline"}
                </Tag>
              </Td>
              <Td>
                <LeadFollowUpDate
                  leadId={lead.id}
                  initialDate={toDateInputValue(lead.nextFollowUpAt)}
                />
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  {lead.status === "new" && <ConvertButton leadId={lead.id} />}
                  <SendEmailModal
                    triggerLabel="Email"
                    defaultTo={lead.email}
                    defaultSubject=""
                    defaultMessage=""
                  />
                  <DeleteButton
                    onDelete={deleteLead.bind(null, lead.id)}
                    confirmText={`Delete the lead "${lead.name}"? This can't be undone.`}
                  />
                </div>
              </Td>
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <Td colSpan={8} className="text-center text-zinc-400">
                No leads yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
