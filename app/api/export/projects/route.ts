import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, toCsv } from "@/lib/csv";
import { fmtDate, money } from "@/lib/format";

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(projects, [
    { header: "Name", value: (p) => p.name },
    { header: "Client", value: (p) => p.client },
    { header: "Status", value: (p) => p.status },
    { header: "Health", value: (p) => p.health },
    { header: "Progress", value: (p) => `${p.progress}%` },
    { header: "Due date", value: (p) => fmtDate(p.dueDate) },
    { header: "Contracted value", value: (p) => money(p.contractedValue) },
    { header: "Next deliverable", value: (p) => p.nextDeliverable },
    { header: "Next meeting", value: (p) => fmtDate(p.nextMeetingAt) },
  ]);

  return csvResponse(csv, "projects.csv");
}
