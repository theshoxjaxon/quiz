import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const sha = (s: string) => createHash("sha256").update(s).digest();

// HTTP Basic Auth for the teacher. Any username; the password is ADMIN_PASSWORD.
export function proxy(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return new NextResponse("ADMIN_PASSWORD is not set on the server.", { status: 500 });

  const encoded = req.headers.get("authorization")?.replace(/^Basic /, "") ?? "";
  const password = Buffer.from(encoded, "base64").toString("utf8").split(":").slice(1).join(":");
  if (timingSafeEqual(sha(password), sha(expected))) return NextResponse.next();

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Teacher dashboard", charset="UTF-8"' },
  });
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
