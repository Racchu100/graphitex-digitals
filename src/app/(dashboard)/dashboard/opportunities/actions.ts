"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function deleteOpportunity(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized: Please log in.");
  }

  // 1. Fetch the opportunity to verify ownership
  const { data: opportunity, error: fetchError } = await supabase
    .from("opportunities")
    .select("posted_by_user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !opportunity) {
    throw new Error("Opportunity not found or access denied.");
  }

  if (opportunity.posted_by_user_id !== user.id) {
    throw new Error("Forbidden: You do not own this opportunity.");
  }

  // 2. Perform the deletion using the admin client (bypasses RLS)
  const adminSupabase = createAdminClient();
  const { error: deleteError } = await adminSupabase
    .from("opportunities")
    .delete()
    .eq("id", id);

  if (deleteError) {
    throw deleteError;
  }

  // Revalidate paths
  revalidatePath("/dashboard/opportunities");
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
  
  return { success: true };
}
