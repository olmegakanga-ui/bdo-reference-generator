import { NextResponse } from "next/server";
import { sendRiskReviewRequestEmail } from "@/lib/email";

export async function GET() {
  try {
    await sendRiskReviewRequestEmail({
      requestId: 1,
      reviewToken: "test-token-123",
      requesterName: "Olmega Kanga",
      requesterEmail: "olmega.kanga@bdo-ea.com",
      clientName: "FINCA RDC",
      departmentName: "Audit & Assurance",
      contractDate: "2026-04-15",
      signatoryName: "Ted Matunga",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}