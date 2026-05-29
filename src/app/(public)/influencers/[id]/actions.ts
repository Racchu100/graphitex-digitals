"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function revealContactDetails(influencerProfileId: string) {
  const supabase = await createClient();
  
  // 1. Get logged-in user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Authentication required. Please log in first.");
  }

  // 2. Verify user is a provider
  const { data: providerRole, error: roleError } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "provider")
    .maybeSingle();

  if (roleError || !providerRole) {
    throw new Error("Only registered brand providers are allowed to reveal contact details.");
  }

  // 3. Insert direct reveal log entry
  const { error: insertError } = await supabase
    .from("contact_reveal_log")
    .insert({
      provider_user_id: user.id,
      influencer_profile_id: influencerProfileId,
    });

  if (insertError) {
    console.error("Failed to insert contact reveal log:", insertError);
    throw new Error("Failed to reveal contact details. Please try again.");
  }

  // 4. Revalidate current route path to refresh data cache
  revalidatePath(`/influencers/${influencerProfileId}`);
}
