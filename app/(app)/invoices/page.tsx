import { prisma } from "@/lib/prisma";
import { LinkButton, PageHeader, StatCard, Table, Th, Td } from "@/components/ui";
import { AddInvoiceModal } from "@/components/modals/AddInvoiceModal";
import { InvoicesTable } from "./InvoicesTable";
import { money } from "@/lib/format";

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
  // Uses paidAt (when money actually arrived), not issuedAt -- an invoice
  // issued last month but paid this month is this month's revenue, not
  // last month's.
  const paidThisMonth = invoices
    .filter(
      (i) =>
        i.status === "Paid" &&
        i.paidAt &&
        i.paidAt.getFullYear() === now.getFullYear() &&
        i.paidAt.getMonth() === now.getMonth()
    )
    .reduce((a, i) => a + i.amount, 0);

  const currentYear = now.getFullYear();
  const paidThisYear = invoices.filter(
    (i) => i.status === "Paid" && i.paidAt && i.paidAt.getFullYear() === currentYear
  );
  const totalThisYear = paidThisYear.reduce((a, i) => a + i.amount, 0);
  const streamGroups = new Map<string, number>();
  for (const inv of paidThisYear) {
    const key = inv.revenueStream || "Uncategorized";
    streamGroups.set(key, (streamGroups.get(key) ?? 0) + inv.amount);
  }
  const revenueByCategory = Array.from(streamGroups.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({ category, amount }));

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

      {revenueByCategory.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
              Revenue by category — {currentYear}
            </h2>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Total paid:{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                {money(totalThisYear)}
              </span>
            </div>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Category</Th>
                <Th>Paid this year</Th>
              </tr>
            </thead>
            <tbody>
              {revenueByCategory.map((row) => (
                <tr key={row.category}>
                  <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {row.category}
                  </Td>
                  <Td>{money(row.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <InvoicesTable
        invoices={invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          client: inv.client,
          amount: inv.amount,
          status: inv.status,
          issuedAt: inv.issuedAt.toISOString(),
          dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
          dealTitle: inv.deal?.title ?? null,
        }))}
      />
    </div>
  );
}
