import { prisma } from "@/lib/prisma";
import { PageHeader, Table, Td, Th, Tag } from "@/components/ui";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  create: "Created",
  delete: "Deleted",
  status_change: "Status changed",
};

const ACTION_TAG: Record<string, "accent" | "accent-2" | "outline"> = {
  create: "accent",
  delete: "accent-2",
  status_change: "outline",
};

function fmtDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AuditLogPage() {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="Who created, deleted, or changed the status of a record, and when"
      />
      <Table>
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Who</Th>
            <Th>Action</Th>
            <Th>Record</Th>
            <Th>Detail</Th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {fmtDateTime(e.createdAt)}
              </Td>
              <Td className="text-sm">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {e.userName || e.userEmail}
                </span>
              </Td>
              <Td>
                <Tag variant={ACTION_TAG[e.action] ?? "outline"}>
                  {ACTION_LABEL[e.action] ?? e.action}
                </Tag>
              </Td>
              <Td className="text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">{e.entityType}</span>{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {e.entityLabel}
                </span>
              </Td>
              <Td className="text-sm text-zinc-500 dark:text-zinc-400">{e.detail || "—"}</Td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <Td colSpan={5} className="text-center text-zinc-400">
                No activity logged yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}
