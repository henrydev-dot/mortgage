import { createHmac } from "crypto";

/** Game session cookie: base64url(address).hmac("game:"+address). */

export const GAME_COOKIE = "mrt_game";

const secret = () => process.env.ADMIN_KEY || "mrt-dev-secret";

export function signGameSession(address: string) {
  const key = address.toLowerCase();
  const sig = createHmac("sha256", secret()).update(`game:${key}`).digest("hex");
  return `${Buffer.from(key, "utf8").toString("base64url")}.${sig}`;
}

/** Returns the wallet address when the cookie is valid, else null. */
export function verifyGameSession(request: Request): string | null {
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${GAME_COOKIE}=([^;]+)`));
  const value = match?.[1];
  if (!value) return null;
  const [b64, sig] = value.split(".");
  if (!b64 || !sig) return null;
  try {
    const address = Buffer.from(b64, "base64url").toString("utf8");
    const expected = createHmac("sha256", secret()).update(`game:${address}`).digest("hex");
    return sig === expected ? address : null;
  } catch {
    return null;
  }
}
