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

const MAX_BYTES = 15 * 1024 * 1024; // 15MB — phone photos are large
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Duck-typed Blob check — the global `File` class only exists on
// Node 20+, and production may run Node 18.
interface UploadedBlob {
  arrayBuffer(): Promise<ArrayBuffer>;
  type: string;
  size: number;
}

function isBlob(value: unknown): value is UploadedBlob {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as UploadedBlob).arrayBuffer === "function" &&
    typeof (value as UploadedBlob).size === "number"
  );
}

export async function POST(request: Request) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!isBlob(file)) {
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
      return NextResponse.json({ error: "Max 15MB." }, { status: 400 });
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
