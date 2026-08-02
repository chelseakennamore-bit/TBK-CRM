import { prisma } from "@/lib/prisma";
import { LinkButton, PageHeader, StatCard, Table, Th, Td } from "@/components/ui";
import { AddInvoiceModal } from "@/components/modals/AddInvoiceModal";
import { InvoiceStatusSelect } from "./InvoiceStatusSelect";
import { DeleteButton } from "@/components/DeleteButton";
import { deleteInvoice } from "@/app/actions/invoices";
import { fmtDate, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const [invoices, wonDeals, companies] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: { deal: { select: { title: true } } },
    }),
    prisma.deal.findMany({
      where: { stage: "Won" },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ]);

  const outstanding = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((a, i) => a + i.amount, 0);
  const overdueCount = invoices.filter((i) => i.status === "Overdue").length;
  const now = new Date();
  const paidThisMonth = invoices
    .filter(
      (i) =>
        i.status === "Paid" &&
        i.issuedAt.getFullYear() === now.getFullYear() &&
        i.issuedAt.getMonth() === now.getMonth()
    )
    .reduce((a, i) => a + i.amount, 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Track amounts owed and payment status"
        action={
          <div className="flex gap-2">
            <LinkButton href="/api/export/invoices">Export CSV</LinkButton>
            <AddInvoiceModal wonDeals={wonDeals} companyNames={companies.map((c) => c.name)} />
          </div>
        }
      />
      <div className="mb-6 flex flex-wrap gap-8">
        <StatCard
          label="Outstanding"
          value={money(outstanding)}
          hint={`${invoices.filter((i) => i.status !== "Paid").length} unpaid invoices`}
        />
        <StatCard
          label="Overdue"
          value={String(overdueCount)}
          hint="Needs follow-up"
        />
        <StatCard
          label="Paid this month"
          value={money(paidThisMonth)}
          hint={now.toLocaleDateString("en-US", { month: "long" })}
        />
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Client</Th>
            <Th>Linked deal</Th>
            <Th>Amount</Th>
            <Th>Issued</Th>
            <Th>Due</Th>
            <Th>Status</Th>
            <Th />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
                {inv.client}
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {inv.deal?.title ?? "—"}
              </Td>
              <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
                {money(inv.amount)}
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {fmtDate(inv.issuedAt)}
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">
                {fmtDate(inv.dueDate)}
              </Td>
              <Td>
                <InvoiceStatusSelect
                  invoiceId={inv.id}
                  initialStatus={inv.status}
                />
              </Td>
              <Td>
                <DeleteButton
                  onDelete={deleteInvoice.bind(null, inv.id)}
                  confirmText={`Delete the ${money(inv.amount)} invoice for ${inv.client}? This can't be undone.`}
                />
              </Td>
            </tr>
          ))}
          {invoices.length === 0 && (
            <tr>
              <Td colSpan={7} className="text-center text-zinc-400">
                No invoices yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
