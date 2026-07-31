import { prisma } from "@/lib/prisma";
import { LinkButton, PageHeader } from "@/components/ui";
import { AddCompanyModal } from "@/components/modals/AddCompanyModal";
import { CompaniesTable } from "./CompaniesTable";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      website: true,
      notes: true,
      _count: { select: { contacts: true, deals: true, invoices: true, projects: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle="Organizations grouped with their contacts, deals, and invoices"
        action={
          <div className="flex gap-2">
            <LinkButton href="/api/export/companies">Export CSV</LinkButton>
            <AddCompanyModal />
          </div>
        }
      />
      <CompaniesTable
        companies={companies.map((c) => ({
          id: c.id,
          name: c.name,
          website: c.website,
          notes: c.notes,
          contactCount: c._count.contacts,
          dealCount: c._count.deals,
          projectCount: c._count.projects,
          invoiceCount: c._count.invoices,
        }))}
      />
    </div>
  );
}
