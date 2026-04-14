import { ApiError } from "@/lib/backend/api";

export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new ApiError(500, "MISSING_ENV", `Missing required environment variable: ${name}`);
  }

  return value;
}
