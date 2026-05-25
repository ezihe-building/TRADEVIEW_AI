/**
 * DEV / OWNER PLAN OVERRIDES
 * ──────────────────────────────────────────────────────────────────
 * Add any email here to force a specific plan tier for that account.
 * Changes take effect immediately on next app reload — no build needed.
 *
 * tier:       "pro" | "base" | "free"
 * expiresAt:  ISO date string "YYYY-MM-DD", or leave undefined for no expiry
 *
 * Example:
 *   { email: "you@example.com", tier: "pro" }
 *   { email: "you@example.com", tier: "base", expiresAt: "2025-12-31" }
 * ──────────────────────────────────────────────────────────────────
 */

export type OverrideTier = "pro" | "base" | "free";

export interface PlanOverride {
  email: string;
  tier: OverrideTier;
  expiresAt?: string;
}

export const PLAN_OVERRIDES: PlanOverride[] = [
  {
    email: "richardezihe73@gmail.com",
    tier: "pro",
    // expiresAt: "2025-12-31",  ← uncomment and set a date to add an expiry
  },
];
