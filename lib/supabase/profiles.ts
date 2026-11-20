import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getClerkDisplayName } from "@/lib/clerk-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupportedLocale = "en" | "sk";

export async function ensureCurrentProfile(preferredLocale: string = "en") {
  const { getToken, userId } = await auth();
  if (!userId) throw new Error("A verified Clerk session is required to create a profile.");
  const [token, user] = await Promise.all([getToken(), currentUser()]);
  if (!token) throw new Error("A verified Clerk session token is required to create a profile.");
  if (!user || user.id !== userId) throw new Error("The current Clerk user could not be verified.");

  const supabase = createSupabaseServerClient(token);
  const locale: SupportedLocale = preferredLocale === "sk" ? "sk" : "en";
  const result = await supabase
    .rpc("sync_current_profile", {
      p_display_name: getClerkDisplayName(user),
      p_preferred_locale: locale,
    })
    .single();

  if (result.error) throw result.error;
  return result.data;
}
