import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "aj_accounts_session";
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5; // 5 days

export type Role = "admin" | "ca";

export type SessionUser = {
  uid: string;
  email: string;
  name: string;
  role: Role;
};

function toRole(value: unknown): Role | null {
  return value === "admin" || value === "ca" ? value : null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth().verifySessionCookie(sessionCookie, true);
    const role = toRole(decoded.role);
    if (!role) return null;

    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: typeof decoded.name === "string" && decoded.name ? decoded.name : decoded.email ?? "User",
      role,
    };
  } catch {
    return null;
  }
}
