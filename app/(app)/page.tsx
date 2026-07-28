import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, Tag } from "@/components/ui";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [deals, leads] = await Promise.all([
    prisma.deal.findMany({
      select: { id: true, title: true, company: true, value: true, stage: true },
    }),
    prisma.lead.findMany({
      orderBy: { receivedAt: "desc" },
      take: 4,
      select: { name: true, company: true, status: true },
    }),
  ]);

  const openDeals = deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost");
  const wonDeals = deals.filter((d) => d.stage === "Won");
  const lostDeals = deals.filter((d) => d.stage === "Lost");
  const pipelineValue = openDeals.reduce((a, d) => a + d.value, 0);
  const winRate =
    wonDeals.length + lostDeals.length === 0
      ? 0
      : Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100);
  const newLeadsCount = await prisma.lead.count({ where: { status: "new" } });

  const topDeals = [...openDeals].sort((a, b) => b.value - a.value).slice(0, 4);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Your pipeline at a glance" />

      <div className="mb-8 flex flex-wrap gap-8">
        <StatCard
          label="Open pipeline value"
          value={money(pipelineValue)}
          hint={`${openDeals.length} open deals`}
        />
        <StatCard
          label="Open deals"
          value={String(openDeals.length)}
          hint="Across all stages"
        />
        <StatCard
          label="Win rate"
          value={`${winRate}%`}
          hint={`${wonDeals.length} won · ${lostDeals.length} lost`}
        />
        <StatCard
          label="New leads"
          value={String(newLeadsCount)}
          hint="Awaiting review"
        />
      </div>

      <div className="grid grid-cols-[1.1fr_1fr] gap-8">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Recent leads
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {leads.map((lead, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {lead.name}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    {lead.company}
                  </div>
                </div>
                <Tag variant={lead.status === "new" ? "accent" : "neutral"}>
                  {lead.status === "new" ? "New" : "In pipeline"}
                </Tag>
              </div>
            ))}
            {leads.length === 0 && (
              <div className="text-sm text-zinc-400">No leads yet.</div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Top open deals
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {topDeals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals?deal=${deal.id}`}
                className="flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {deal.title}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    {deal.company}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {money(deal.value)}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {deal.stage}
                  </div>
                </div>
              </Link>
            ))}
            {topDeals.length === 0 && (
              <div className="text-sm text-zinc-400">No open deals yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
