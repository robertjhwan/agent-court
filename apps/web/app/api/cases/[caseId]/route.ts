import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    
    const caseData = await db.cases.findUnique({
      where: { id: caseId },
    });

    if (!caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json(caseData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch case" }, { status: 500 });
  }
}
