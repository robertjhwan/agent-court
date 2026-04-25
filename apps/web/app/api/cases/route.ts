import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cases = await db.cases.findMany();

    return NextResponse.json({ cases });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { task } = body;

    if (!task) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 });
    }

    const newCase = await db.cases.create({
      data: {
        task,
        status: "PENDING",
        verdict: null,
        sentence: null,
      },
    });

    return NextResponse.json({ caseId: newCase.id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create case" }, { status: 500 });
  }
}
