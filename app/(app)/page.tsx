import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, Tag } from "@/components/ui";
import { money, daysAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const STALE_DAYS = 14;

export default async function DashboardPage() {
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - STALE_DAYS * 86400000);

  const [deals, newLeads, followUpContacts, followUpLeads, openDealsForAttention] =
    await Promise.all([
      prisma.deal.findMany({
        select: { id: true, title: true, company: true, value: true, stage: true },
      }),
      prisma.lead.findMany({
        where: { status: "new" },
        orderBy: { receivedAt: "desc" },
        take: 5,
        select: { id: true, name: true, company: true, receivedAt: true },
      }),
      prisma.contact.findMany({
        where: { nextFollowUpAt: { lte: now } },
        select: { id: true, name: true, company: true, nextFollowUpAt: true },
      }),
      prisma.lead.findMany({
        where: { nextFollowUpAt: { lte: now } },
        select: { id: true, name: true, company: true, nextFollowUpAt: true },
      }),
      prisma.deal.findMany({
        where: { stage: { notIn: ["Won", "Lost"] } },
        select: {
          id: true,
          title: true,
          company: true,
          nextStep: true,
          nextStepDueAt: true,
          updatedAt: true,
        },
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

  const followUps = [
    ...followUpContacts.map((c) => ({
      id: c.id,
      kind: "Contact" as const,
      name: c.name,
      company: c.company,
      dueAt: c.nextFollowUpAt!,
      href: "/contacts",
    })),
    ...followUpLeads.map((l) => ({
      id: l.id,
      kind: "Lead" as const,
      name: l.name,
      company: l.company,
      dueAt: l.nextFollowUpAt!,
      href: "/leads",
    })),
  ]
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .slice(0, 5);

  const dealsNeedingFollowUp = openDealsForAttention
    .map((d) => {
      const overdue = d.nextStepDueAt && d.nextStepDueAt.getTime() < now.getTime();
      const stale = d.updatedAt.getTime() < staleCutoff.getTime();
      let reason: string | null = null;
      if (overdue) reason = "Next step overdue";
      else if (!d.nextStep) reason = "No next step";
      else if (stale) reason = `No activity in ${STALE_DAYS}+ days`;
      return reason ? { ...d, reason } : null;
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .slice(0, 5);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="What needs your attention today" />

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

      <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Needs attention
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-6">
        <AttentionPanel title="New leads to review" emptyLabel="No new leads.">
          {newLeads.map((lead) => (
            <Link
              key={lead.id}
              href="/leads"
              className="flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {lead.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {lead.company}
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {daysAgo(lead.receivedAt)}
              </div>
            </Link>
          ))}
        </AttentionPanel>

        <AttentionPanel title="Follow-ups due" emptyLabel="Nothing due — you're caught up.">
          {followUps.map((f) => (
            <Link
              key={`${f.kind}-${f.id}`}
              href={f.href}
              className="flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {f.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {f.kind} · {f.company}
                </div>
              </div>
              <Tag variant={f.dueAt.getTime() < now.getTime() ? "accent-2" : "neutral"}>
                {daysAgo(f.dueAt)}
              </Tag>
            </Link>
          ))}
        </AttentionPanel>

        <AttentionPanel
          title="Deals needing follow-up"
          emptyLabel="Every open deal has a next step."
          className="col-span-2"
        >
          {dealsNeedingFollowUp.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals?deal=${deal.id}`}
              className="flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-50">
                  {deal.title}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {deal.company}
                </div>
              </div>
              <Tag variant="accent-2">{deal.reason}</Tag>
            </Link>
          ))}
        </AttentionPanel>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Top open deals
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {topDeals.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals?deal=${deal.id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
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
  );
}

function AttentionPanel({
  title,
  emptyLabel,
  className,
  children,
}: {
  title: string;
  emptyLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div
      className={
        "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 " +
        (className ?? "")
      }
    >
      <div className="mb-3 text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {title}
      </div>
      <div className="flex flex-col gap-3">
        {hasChildren ? children : <div className="text-sm text-zinc-400">{emptyLabel}</div>}
      </div>
    </div>
  );
}
