import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { checkAdminKey } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * Admin image upload. Files land in <cwd>/uploads and are served by
 * /api/uploads/[file] — no dependency on the build-time public folder,
 * so it works on Dokploy without volume or permission surprises.
 * (Mount a volume on /app/uploads to survive redeploys.)
 */

const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file." }, { status: 400 });
    }
    const ext = TYPES[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, or GIF images." },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Max 6MB." }, { status: 400 });
    }

    const dir = path.join(process.cwd(), "uploads");
    fs.mkdirSync(dir, { recursive: true });
    const name = `${Date.now()}-${randomBytes(5).toString("hex")}.${ext}`;
    fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ ok: true, url: `/api/uploads/${name}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
