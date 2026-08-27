import { supabase } from "@/integrations/supabase/client";

/**
 * The Supabase project's signing keys can rotate. When that happens, any
 * session token minted before the rotation becomes permanently unverifiable
 * ("bad_jwt: unrecognized JWT kid ..."), even though it looks valid to the
 * browser (session is still cached in localStorage and hasn't "expired").
 * Every authenticated request (PostgREST inserts, storage uploads, server
 * functions) then fails identically. The only fix is to clear the stale
 * session and have the user sign in again to mint a token with the current
 * signing key.
 */
const STALE_SESSION_PATTERNS = [
  /bad_jwt/i,
  /unrecognized jwt kid/i,
  /jwt signature/i,
  /invalid jwt/i,
  /invalid claim/i,
  /pgrst301/i,
];

function extractMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && "message" in error) return String((error as { message: unknown }).message ?? "");
  return "";
}

/** True when an error indicates the current session token can no longer be verified by the server. */
export function isStaleSessionError(error: unknown): boolean {
  const message = extractMessage(error);
  if (!message) return false;
  return STALE_SESSION_PATTERNS.some((pattern) => pattern.test(message));
}

/** Clears the dead local session so the UI stops pretending the user is signed in. */
export async function clearStaleSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Best-effort: even if the network sign-out call fails, drop the local session.
  }
}
