import { NextResponse } from "next/server";
import { syncNow } from "@/app/actions/leads";

// Invoked by Vercel Cron (see vercel.json). Vercel automatically sends
// `Authorization: Bearer <CRON_SECRET>` for scheduled invocations once
// CRON_SECRET is set as an env var, which is what we check here — this
// is not a user session, so it's excluded from proxy.ts's auth gate.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncNow();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/sync-leads] failed:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
