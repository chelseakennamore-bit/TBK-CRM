import { prisma } from "@/lib/prisma";
import { LinkButton, PageHeader } from "@/components/ui";
import { AddDealModal } from "@/components/modals/AddDealModal";
import { DealsBoard } from "./DealsBoard";

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const { deal } = await searchParams;
  const [deals, companies, contacts] = await Promise.all([
    prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        company: true,
        value: true,
        stage: true,
        closeDate: true,
        nextStep: true,
        nextStepDueAt: true,
      },
    }),
    prisma.company.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
    prisma.contact.findMany({
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="Drag cards across stages to update status"
        action={
          <div className="flex gap-2">
            <LinkButton href="/api/export/deals">Export CSV</LinkButton>
            <AddDealModal companyNames={companies.map((c) => c.name)} contacts={contacts} />
          </div>
        }
      />
      <DealsBoard
        key={deals.map((d) => d.id).join(",")}
        initialDeals={deals.map((d) => ({
          ...d,
          closeDate: d.closeDate ? d.closeDate.toISOString() : null,
          nextStepDueAt: d.nextStepDueAt ? d.nextStepDueAt.toISOString() : null,
        }))}
        initialSelectedId={deal}
        companyNames={companies.map((c) => c.name)}
        contacts={contacts}
      />
    </div>
  );
}
