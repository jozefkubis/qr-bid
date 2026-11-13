import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uniqueViolation = "23505";

export async function ensureCurrentProfile() {
  const { getToken, userId } = await auth();
  if (!userId) throw new Error("A verified Clerk session is required to create a profile.");
  const token = await getToken();
  if (!token) throw new Error("A verified Clerk session token is required to create a profile.");

  const supabase = createSupabaseServerClient(token);
  const inserted = await supabase
    .from("profiles")
    .insert({ clerk_user_id: userId })
    .select("id, clerk_user_id, created_at")
    .single();

  if (!inserted.error) return inserted.data;
  if (inserted.error.code !== uniqueViolation) throw inserted.error;

  const existing = await supabase
    .from("profiles")
    .select("id, clerk_user_id, created_at")
    .eq("clerk_user_id", userId)
    .single();

  if (existing.error) throw existing.error;
  return existing.data;
}
