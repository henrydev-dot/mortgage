import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "emails.txt");
    
    // Append the email with a timestamp
    const data = `${new Date().toISOString()} - ${email}\n`;
    fs.appendFileSync(filePath, data, "utf8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
