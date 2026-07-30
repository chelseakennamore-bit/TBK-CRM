import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET() {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(contacts, [
    { header: "Name", value: (c) => c.name },
    { header: "Company", value: (c) => c.company },
    { header: "Title", value: (c) => c.title },
    { header: "Email", value: (c) => c.email },
    { header: "Phone", value: (c) => c.phone },
  ]);

  return csvResponse(csv, "contacts.csv");
}
