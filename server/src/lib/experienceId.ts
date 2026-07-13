import { createHash } from "node:crypto";
import type { BookingJson } from "@shared/booking";

export function experienceIdFor(booking: BookingJson): string {
  const identity = `${booking.operator_name.trim().toLowerCase()}|${booking.activity
    .trim()
    .toLowerCase()}`;
  const prefix = booking.operator_name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 36) || "experience";
  const suffix = createHash("sha256").update(identity).digest("hex").slice(0, 10);
  return `${prefix}-${suffix}`;
}
