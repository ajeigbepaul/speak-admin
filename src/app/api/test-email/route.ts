import { NextRequest, NextResponse } from "next/server";
import { testEmailConfiguration } from "@/lib/test-email";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { success: false, message: "Missing email parameter" },
      { status: 400 }
    );
  }

  const result = await testEmailConfiguration(email);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
