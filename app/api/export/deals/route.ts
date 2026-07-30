import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, toCsv } from "@/lib/csv";
import { fmtDate, money } from "@/lib/format";

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(deals, [
    { header: "Title", value: (d) => d.title },
    { header: "Company", value: (d) => d.company },
    { header: "Contact", value: (d) => d.contactName },
    { header: "Value", value: (d) => money(d.value) },
    { header: "Stage", value: (d) => d.stage },
    { header: "Close date", value: (d) => fmtDate(d.closeDate) },
    { header: "Notes", value: (d) => d.notes },
  ]);

  return csvResponse(csv, "deals.csv");
}
