"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/audit";

/**
 * Server Action to securely insert in-app notifications.
 * Runs on the server utilizing createAdminClient to bypass client-side RLS constraints.
 */
export async function sendInAppNotification(
  userId: string,
  type: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  if (!userId || !type || !title) {
    throw new Error("Missing required notification fields");
  }

  try {
    const adminSupabase = createAdminClient();
    await createNotification(adminSupabase, userId, type, title, body, data);
    return { success: true };
  } catch (err: any) {
    console.error("Error in sendInAppNotification Server Action:", err);
    return { success: false, error: err.message };
  }
}
