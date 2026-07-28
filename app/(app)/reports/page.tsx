import { prisma } from "@/lib/prisma";
import { PageHeader, Table, Th, Td } from "@/components/ui";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [leads, wonDeals] = await Promise.all([
    prisma.lead.findMany({ select: { source: true, status: true } }),
    prisma.deal.findMany({
      where: { stage: "Won", closeDate: { not: null } },
      select: { value: true, closeDate: true },
    }),
  ]);

  const sourceGroups = new Map<string, { count: number; converted: number }>();
  for (const lead of leads) {
    const g = sourceGroups.get(lead.source) ?? { count: 0, converted: 0 };
    g.count += 1;
    if (lead.status === "in_pipeline") g.converted += 1;
    sourceGroups.set(lead.source, g);
  }
  const sourcePerf = Array.from(sourceGroups.entries()).map(([source, g]) => ({
    source,
    count: g.count,
    converted: g.converted,
    rateLabel: g.count === 0 ? "0%" : `${Math.round((g.converted / g.count) * 100)}%`,
  }));

  const monthGroups = new Map<string, number>();
  for (const deal of wonDeals) {
    if (!deal.closeDate) continue;
    const key = deal.closeDate.toISOString().slice(0, 7);
    monthGroups.set(key, (monthGroups.get(key) ?? 0) + deal.value);
  }
  const monthKeys = Array.from(monthGroups.keys()).sort();
  const maxMonthVal = Math.max(1, ...monthKeys.map((k) => monthGroups.get(k) ?? 0));
  const monthlyRevenue = monthKeys.map((key) => {
    const val = monthGroups.get(key) ?? 0;
    return {
      label: new Date(`${key}-01T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      valueLabel: money(val),
      widthPct: Math.round((val / maxMonthVal) * 100),
    };
  });

  return (
    <div>
      <PageHeader title="Reports" subtitle="Lead sources and revenue trends" />
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Lead source performance
          </h2>
          <div className="mt-3">
            <Table>
              <thead>
                <tr>
                  <Th>Source</Th>
                  <Th>Leads</Th>
                  <Th>Converted</Th>
                  <Th>Rate</Th>
                </tr>
              </thead>
              <tbody>
                {sourcePerf.map((row) => (
                  <tr key={row.source}>
                    <Td className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {row.source}
                    </Td>
                    <Td>{row.count}</Td>
                    <Td>{row.converted}</Td>
                    <Td className="text-zinc-500 dark:text-zinc-400">
                      {row.rateLabel}
                    </Td>
                  </tr>
                ))}
                {sourcePerf.length === 0 && (
                  <tr>
                    <Td colSpan={4} className="text-center text-zinc-400">
                      No leads yet.
                    </Td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            Monthly revenue (won deals)
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {monthlyRevenue.map((m) => (
              <div key={m.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <div>{m.label}</div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {m.valueLabel}
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-md bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-md bg-indigo-600"
                    style={{ width: `${m.widthPct}%` }}
                  />
                </div>
              </div>
            ))}
            {monthlyRevenue.length === 0 && (
              <div className="text-sm text-zinc-400">No won deals yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
