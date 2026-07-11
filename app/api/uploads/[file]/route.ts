import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/** Serves admin-uploaded images from <cwd>/uploads. */
export async function GET(_request: Request, { params }: { params: { file: string } }) {
  // Strict name check — no traversal, only files our uploader produces
  const name = params.file;
  const match = name.match(/^[0-9]+-[a-f0-9]{10}\.(jpg|png|webp|gif)$/);
  if (!match) return new Response("Not found", { status: 404 });

  const filePath = path.join(process.cwd(), "uploads", name);
  try {
    const buffer = fs.readFileSync(filePath);
    return new Response(buffer, {
      headers: {
        "Content-Type": MIME[match[1]],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
