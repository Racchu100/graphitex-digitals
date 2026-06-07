import React from "react";
import InfluencersDirectoryClient from "@/components/directory/InfluencersDirectoryClient";
import ComingSoon from "@/components/ui/ComingSoon";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Influencer Directory & Creator Partnerships",
  description: "Connect and collaborate with verified influencers and creators. Filter by niche, platform, and audience reach to launch high-impact campaigns on Graphitex Digitals.",
};

// Fallback dummy data for visual aesthetics until at least 1 actual record is created in the database
const dummyInfluencers = [
  {
    id: "dummy-inf-1",
    display_name: "Neha Sharma",
    profile_picture_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
    currency: "Rs.",
    price_min: 8000,
    price_max: 20000,
    categories: { name: "Fashion & Lifestyle" },
    niche_category_names: ["Fashion & Lifestyle", "Beauty & Cosmetics"],
    cities: { name: "Mumbai" },
    influencer_social_accounts: [
      { id: "sa-1", platform: "instagram", follower_count: 280000 }
    ]
  },
  {
    id: "dummy-inf-2",
    display_name: "Rohan Verma",
    profile_picture_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    currency: "Rs.",
    price_min: 15000,
    price_max: 35000,
    categories: { name: "Tech & Gadgets" },
    niche_category_names: ["Tech & Gadgets", "Gaming & Esports"],
    cities: { name: "Bengaluru" },
    influencer_social_accounts: [
      { id: "sa-2", platform: "youtube", follower_count: 450000 },
      { id: "sa-3", platform: "instagram", follower_count: 120000 }
    ]
  },
  {
    id: "dummy-inf-3",
    display_name: "Pooja Hegde",
    profile_picture_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
    currency: "Rs.",
    price_min: 5000,
    price_max: 12000,
    categories: { name: "Travel & Food" },
    niche_category_names: ["Travel & Food", "Photography"],
    cities: { name: "Goa" },
    influencer_social_accounts: [
      { id: "sa-4", platform: "instagram", follower_count: 95000 }
    ]
  }
];

export default async function InfluencersDirectoryPage() {
  const supabase = await createClient();

  // Check current user auth & role
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  let isInfluencer = false;
  let ownProfilePath: string | undefined;
  let ownProfileName: string | undefined;

  if (user) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roleNames = (roles ?? []).map((r: { role: string }) => r.role);
    isAdmin = roleNames.includes("admin");
    isInfluencer = roleNames.includes("influencer");

    // Fetch own influencer profile for the profile link
    if (isInfluencer && !isAdmin) {
      const { data: ownProfile } = await supabase
        .from("influencer_profiles")
        .select("id, slug, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (ownProfile) {
        ownProfilePath = `/influencers/${ownProfile.slug || ownProfile.id}`;
        ownProfileName = ownProfile.display_name;
      }
    }
  }

  // ── Non-admin → Coming Soon ─────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <ComingSoon
        type="influencers"
        hasOwnProfile={isInfluencer && !!ownProfilePath}
        ownProfilePath={ownProfilePath}
        ownProfileName={ownProfileName}
      />
    );
  }

  // ── Admin → Full directory ──────────────────────────────────────────────────
  const { data: profiles, error } = await supabase
    .from("influencer_profiles")
    .select(`
      *,
      categories(name),
      cities(name),
      influencer_social_accounts(id, platform, follower_count)
    `)
    .eq("status", "published")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching influencers:", error);

  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true);

  let mappedProfiles = null;
  if (profiles && profiles.length > 0) {
    mappedProfiles = profiles.map(profile => {
      let nicheNames: string[] = [];
      if (profile.niche_category_ids && profile.niche_category_ids.length > 0) {
        nicheNames = profile.niche_category_ids
          .map((id: number) => allCategories?.find(c => c.id === id)?.name)
          .filter(Boolean) as string[];
      }
      if (nicheNames.length === 0 && profile.categories?.name) {
        nicheNames = [profile.categories.name];
      }
      return { ...profile, niche_category_names: nicheNames };
    });
  }

  const activeProfiles = mappedProfiles && mappedProfiles.length > 0 ? mappedProfiles : dummyInfluencers;
  const isDemoMode = !profiles || profiles.length === 0;

  return (
    <InfluencersDirectoryClient
      initialProfiles={activeProfiles}
      isDemoMode={isDemoMode}
      isProvider={false}
    />
  );
}
