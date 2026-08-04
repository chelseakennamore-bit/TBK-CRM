import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, toCsv } from "@/lib/csv";
import { fmtDate } from "@/lib/format";

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    orderBy: { receivedAt: "desc" },
  });

  const csv = toCsv(leads, [
    { header: "Name", value: (l) => l.name },
    { header: "Company", value: (l) => l.company },
    { header: "Email", value: (l) => l.email },
    { header: "Message", value: (l) => l.message },
    { header: "Source", value: (l) => l.source },
    { header: "Received", value: (l) => fmtDate(l.receivedAt) },
    {
      header: "Status",
      value: (l) =>
        l.status === "new" ? "New" : l.status === "closed" ? "Closed" : "In pipeline",
    },
  ]);

  return csvResponse(csv, "leads.csv");
}
