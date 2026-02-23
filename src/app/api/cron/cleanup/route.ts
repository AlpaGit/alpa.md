import { NextResponse } from "next/server";
import { purgeExpiredDocuments } from "@/lib/storage";

export async function GET(request: Request) {
  // Verify the request comes from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await purgeExpiredDocuments();
  return NextResponse.json({ deleted });
}
