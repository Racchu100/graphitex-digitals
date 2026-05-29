"use client";

import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: any = null;

// Robust storage wrapper that handles localStorage errors on every individual call dynamically
const getSafeStorage = () => {
  if (typeof window === "undefined") return undefined;
  
  const inMemoryStore: Record<string, string> = {};
  
  return {
    getItem: (key: string) => {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn(`SafeStorage: read failed for key "${key}", using fallback:`, e);
        return inMemoryStore[key] || null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        console.warn(`SafeStorage: write failed for key "${key}", using fallback:`, e);
        inMemoryStore[key] = value;
      }
    },
    removeItem: (key: string) => {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        console.warn(`SafeStorage: delete failed for key "${key}", using fallback:`, e);
        delete inMemoryStore[key];
      }
    }
  };
};


export function createClient() {
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  if (!supabaseClient) {
    const safeStorage = getSafeStorage();
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: safeStorage,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  return supabaseClient;
}

