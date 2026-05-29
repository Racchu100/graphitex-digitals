import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, UserRole } from "@/types/database";

export function useUser() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchUser(authUser: any) {
      if (!authUser) {
        if (active) {
          setUser(null);
          setRoles([]);
          setLoading(false);
        }
        return;
      }

      try {
        const { data: userData, error: dbError } = await supabase
          .from("users")
          .select("*, user_roles!user_id(*), states(name), cities(name)")
          .eq("id", authUser.id)
          .single();

        if (dbError && dbError.code !== 'PGRST116') {
          throw dbError;
        }

        if (active) {
          if (userData) {
            const { user_roles, ...rest } = userData as any;
            setUser(rest as User);
            setRoles(Array.isArray(user_roles) ? user_roles : []);
          } else {
            // Fallback during onboarding or when profile not seeded
            setUser({
              id: authUser.id,
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || "New User",
              email: authUser.email || null,
              mobile_number: authUser.phone || authUser.user_metadata?.phone || "",
              mobile_verified: !!authUser.phone_confirmed_at,
              country_id: 0,
              state_id: 0,
              city_id: 0,
              avatar_url: authUser.user_metadata?.avatar_url || null,
              status: "active",
              created_at: authUser.created_at,
              updated_at: authUser.created_at,
            } as User);
            setRoles([]);
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (active) {
          if (session?.user) {
            await fetchUser(session.user);
          } else {
            setUser(null);
            setRoles([]);
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.warn("Failed to retrieve Supabase session on mount:", err);
        if (active) {
          setError(err);
          setUser(null);
          setRoles([]);
          setLoading(false);
        }
      }
    }

    // Safety timeout to prevent infinite loading lockups if network/session initialization hangs
    const safetyTimeout = setTimeout(() => {
      if (active) {
        console.warn("Auth initialization safety timeout triggered. Ensuring loading is false.");
        setLoading(false);
      }
    }, 3500);

    initAuth();

    // Subscribe to auth changes to sync state instantly (on log in, log out, etc.)
    let subscription: any = null;
    try {
      const res = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
        if (!active) return;
        try {
          if (session?.user) {
            setLoading(true);
            await fetchUser(session.user);
          } else {
            setUser(null);
            setRoles([]);
            setLoading(false);
          }
        } catch (err: any) {
          console.warn("Auth change fetch failed:", err);
          if (active) {
            setUser(null);
            setRoles([]);
            setLoading(false);
          }
        }
      });
      subscription = res.data?.subscription;
    } catch (err) {
      console.warn("Failed to subscribe to auth state changes:", err);
      if (active) {
        setLoading(false);
      }
    }

    const handleProfileUpdate = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && active) {
          setLoading(true);
          await fetchUser(authUser);
        }
      } catch (err) {
        console.error("Failed to update user profile hook:", err);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("user-profile-updated", handleProfileUpdate);
    }

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
      if (subscription) {
        subscription.unsubscribe();
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("user-profile-updated", handleProfileUpdate);
      }
    };
  }, [supabase]);

  return { user, roles, loading, error };
}
