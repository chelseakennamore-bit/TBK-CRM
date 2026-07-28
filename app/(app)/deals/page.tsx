import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { AddDealModal } from "@/components/modals/AddDealModal";
import { DealsBoard } from "./DealsBoard";

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const { deal } = await searchParams;
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      company: true,
      value: true,
      stage: true,
      closeDate: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="Drag cards across stages to update status"
        action={<AddDealModal />}
      />
      <DealsBoard
        key={deals.map((d) => d.id).join(",")}
        initialDeals={deals.map((d) => ({
          ...d,
          closeDate: d.closeDate ? d.closeDate.toISOString() : null,
        }))}
        initialSelectedId={deal}
      />
    </div>
  );
}
