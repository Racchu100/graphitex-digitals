import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  props: { params: Promise<{ provider: string }> }
) {
  const params = await props.params;
  const provider = params.provider;

  // Verify this matches the required "google." path segment
  if (provider !== "google" && provider !== "google.") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if the user profile exists in our 'users' table
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!dbUser) {
        // New user has no profile record yet; route to onboarding
        return NextResponse.redirect(new URL("/onboarding", request.url));
      } else {
        // User profile exists; fetch user roles to redirect to the proper directory
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id);

        const isAdmin = userRoles?.some((r: any) => r.role === 'admin');

        if (isAdmin) {
          return NextResponse.redirect(new URL("/admin", request.url));
        } else {
          return NextResponse.redirect(new URL("/services", request.url));
        }
      }
    }
  }

  // Redirect back to login page with error query param in case of failure
  return NextResponse.redirect(
    new URL("/login?error=Google authentication failed", request.url)
  );
}
