import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User, UserRole } from "@/types/database";

// Robust storage wrapper that handles localStorage privacy/SecurityError exceptions dynamically
const getSafeStorage = () => {
  if (typeof window === "undefined") return null;
  return {
    getItem: (key: string) => {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn(`SafeStorage: read failed for key "${key}":`, e);
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn(`SafeStorage: write failed for key "${key}":`, e);
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn(`SafeStorage: delete failed for key "${key}":`, e);
      }
    }
  };
};

export function useUser() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    // 1. Immediately read from localStorage cache on client-side mount
    // This resolves initial loading gray circles / screen freeze issues instantly on page refresh or navigation
    const storage = getSafeStorage();
    if (storage) {
      const cached = storage.getItem("graphitex_cached_user");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.user) {
            setUser(parsed.user);
            setRoles(parsed.roles || []);
            setLoading(false);
          }
        } catch (e) {
          console.warn("Failed to parse cached user on mount:", e);
        }
      }
    }

    async function fetchUser(authUser: any) {
      if (!authUser) {
        if (active) {
          setUser(null);
          setRoles([]);
          setLoading(false);
          const storage = getSafeStorage();
          if (storage) {
            storage.removeItem("graphitex_cached_user");
          }
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
            const updatedUser = rest as User;
            const updatedRoles = Array.isArray(user_roles) ? user_roles : [];
            setUser(updatedUser);
            setRoles(updatedRoles);

            // Dynamically cache values to survive tab switches/refreshes cleanly
            const storage = getSafeStorage();
            if (storage) {
              storage.setItem(
                "graphitex_cached_user",
                JSON.stringify({ user: updatedUser, roles: updatedRoles })
              );
            }
          } else {
            // Fallback during onboarding or when profile not seeded
            const fallbackUser = {
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
            } as User;
            
            setUser(fallbackUser);
            setRoles([]);

            const storage = getSafeStorage();
            if (storage) {
              storage.setItem(
                "graphitex_cached_user",
                JSON.stringify({ user: fallbackUser, roles: [] })
              );
            }
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
            const storage = getSafeStorage();
            if (storage) {
              storage.removeItem("graphitex_cached_user");
            }
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
            // Only set loading to true if we don't have a cached session or user to avoid jarring screen blankouts
            const storage = getSafeStorage();
            const hasCached = storage ? !!storage.getItem("graphitex_cached_user") : false;
            if (!hasCached) {
              setLoading(true);
            }
            await fetchUser(session.user);
          } else {
            setUser(null);
            setRoles([]);
            setLoading(false);
            const storage = getSafeStorage();
            if (storage) {
              storage.removeItem("graphitex_cached_user");
            }
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
          // Silent refresh inside dashboard so user sees instant updates without flickering page blocks
          await fetchUser(authUser);
        }
      } catch (err) {
        console.error("Failed to update user profile hook:", err);
      }
    };

    // Recover from background browser tab sleeps silently on tab visibility changes
    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && active) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && active) {
            // Quiet background update to keep user session fully dynamic without gray circles/spinners
            await fetchUser(session.user);
          }
        } catch (err) {
          console.warn("Failed to refresh user on tab visibility change:", err);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("user-profile-updated", handleProfileUpdate);
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
      if (subscription) {
        subscription.unsubscribe();
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("user-profile-updated", handleProfileUpdate);
        document.removeEventListener("visibilitychange", handleVisibility);
      }
    };
  }, [supabase]);

  return { user, roles, loading, error };
}
