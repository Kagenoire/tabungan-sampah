import { adminAuth } from "@/lib/firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";

export class UnauthorizedError extends Error {}

// Every signed-in Firebase Auth user in this project is an admin (Karang
// Taruna) - there is no separate role field, matching the brief's single
// "Admin" role. This just verifies the caller has a live session, and that
// the account has not since been disabled by another admin.
export async function requireAdmin(request: Request): Promise<DecodedIdToken> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new UnauthorizedError("Missing token");

  const decoded = await adminAuth()
    .verifyIdToken(token)
    .catch(() => {
      throw new UnauthorizedError("Invalid token");
    });

  const user = await adminAuth().getUser(decoded.uid);
  if (user.disabled) throw new UnauthorizedError("Account disabled");

  return decoded;
}
