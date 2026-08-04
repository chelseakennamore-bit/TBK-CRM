import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      primaryContact: { select: { name: true } },
      _count: { select: { contacts: true, deals: true, invoices: true } },
    },
  });

  const csv = toCsv(companies, [
    { header: "Name", value: (c) => c.name },
    { header: "Website", value: (c) => c.website },
    { header: "Primary contact", value: (c) => c.primaryContact?.name ?? "" },
    { header: "Contacts", value: (c) => c._count.contacts },
    { header: "Deals", value: (c) => c._count.deals },
    { header: "Invoices", value: (c) => c._count.invoices },
    { header: "Notes", value: (c) => c.notes },
  ]);

  return csvResponse(csv, "companies.csv");
}
