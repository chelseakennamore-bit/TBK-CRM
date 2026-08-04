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
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { order: "asc" } },
      activities: { orderBy: { ts: "desc" } },
      lineItems: { orderBy: { order: "asc" } },
      contactRecord: { select: { email: true } },
    },
  });

  if (!deal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { contactRecord, ...rest } = deal;
  return NextResponse.json({ ...rest, contactEmail: contactRecord?.email ?? "" });
}
