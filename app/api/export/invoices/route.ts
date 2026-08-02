import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, toCsv } from "@/lib/csv";
import { fmtDate, money } from "@/lib/format";

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { deal: { select: { title: true } } },
  });

  const csv = toCsv(invoices, [
    { header: "Invoice #", value: (i) => (i.invoiceNumber ? String(i.invoiceNumber) : "") },
    { header: "Client", value: (i) => i.client },
    { header: "Linked deal", value: (i) => i.deal?.title ?? "" },
    { header: "Amount", value: (i) => money(i.amount) },
    { header: "Revenue category", value: (i) => i.revenueStream },
    { header: "Status", value: (i) => i.status },
    { header: "Issued", value: (i) => fmtDate(i.issuedAt) },
    { header: "Due", value: (i) => fmtDate(i.dueDate) },
    { header: "Paid", value: (i) => fmtDate(i.paidAt) },
  ]);

  return csvResponse(csv, "invoices.csv");
}
