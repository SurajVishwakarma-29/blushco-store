import { auth } from "@clerk/nextjs/server";

import { ApiError } from "@/lib/backend/api";

export type AppRole = "CUSTOMER" | "ADMIN";

export interface AuthContext {
  userId: string | null;
  role: AppRole;
  email: string | null;
}

function parseBearerToken(header: string | null): string | null {
  if (!header) return null;
  if (!header.startsWith("Bearer ")) return null;

  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function getAuthContext(request: Request): Promise<AuthContext> {
  const clerkAuth = await auth();

  const fallbackUserId =
    request.headers.get("x-user-id") ??
    request.headers.get("x-clerk-user-id") ??
    parseBearerToken(request.headers.get("authorization"));

  const userId = clerkAuth.userId ?? fallbackUserId;

  const roleHeader = (request.headers.get("x-user-role") ?? "CUSTOMER").toUpperCase();
  const role: AppRole = roleHeader === "ADMIN" ? "ADMIN" : "CUSTOMER";

  const email = request.headers.get("x-user-email");

  return {
    userId,
    role,
    email,
  };
}

export function requireSignedIn(authContext: AuthContext) {
  if (!authContext.userId) {
    throw new ApiError(401, "UNAUTHENTICATED", "You must be signed in to perform this action.");
  }

  return authContext.userId;
}

export function requireAdmin(authContext: AuthContext) {
  requireSignedIn(authContext);

  if (authContext.role !== "ADMIN") {
    throw new ApiError(403, "FORBIDDEN", "Admin access required.");
  }
}
