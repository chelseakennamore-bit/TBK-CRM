import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { name: "asc" } },
      primaryContact: { select: { id: true, name: true } },
      deals: {
        orderBy: { createdAt: "desc" },
        include: { lineItems: { orderBy: { order: "asc" } } },
      },
      invoices: { orderBy: { createdAt: "desc" } },
      projects: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { ts: "desc" } },
    },
  });

  if (!company) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(company);
}
