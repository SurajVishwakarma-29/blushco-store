import { ApiError } from "@/lib/backend/api";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function ensureSlug(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return slugify(value);
  }

  const generated = slugify(fallback);

  if (!generated) {
    throw new ApiError(400, "INVALID_SLUG", "Unable to generate slug from provided input.");
  }

  return generated;
}
