import React from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import InfluencerProfileClient from "./InfluencerProfileClient";
import { getInfluencerSlug } from "@/lib/utils/slug";
import type { Metadata } from "next";

interface InfluencerDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: InfluencerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let profile = null;

  if (isUUID) {
    const { data } = await supabase
      .from("influencer_profiles")
      .select("display_name, bio, categories:niche_category_id(name), cities(name)")
      .eq("id", id)
      .maybeSingle();
    profile = data;
  } else {
    const searchName = id.replace(/-/g, " ");
    const { data } = await supabase
      .from("influencer_profiles")
      .select("id, display_name, bio, categories:niche_category_id(name), cities(name)")
      .ilike("display_name", searchName)
      .maybeSingle();

    profile = data;

    if (!profile) {
      const { data: allProfiles } = await supabase
        .from("influencer_profiles")
        .select("id, display_name");

      const matching = allProfiles?.find(
        (p) => getInfluencerSlug(p.display_name) === id
      );

      if (matching) {
        const { data: fullProfile } = await supabase
          .from("influencer_profiles")
          .select("display_name, bio, categories:niche_category_id(name), cities(name)")
          .eq("id", matching.id)
          .maybeSingle();
        profile = fullProfile;
      }
    }
  }

  if (!profile) {
    return {
      title: "Influencer Profile Details",
    };
  }

  const categoryName = (Array.isArray(profile.categories) ? profile.categories[0]?.name : (profile.categories as any)?.name) || "Creator";
  const cityName = (Array.isArray(profile.cities) ? profile.cities[0]?.name : (profile.cities as any)?.name) || "Mangalore";
  const title = `${profile.display_name} - ${categoryName} Influencer in ${cityName}`;
  
  let bioText = "";
  try {
    if (profile.bio && profile.bio.trim().startsWith("{")) {
      const parsed = JSON.parse(profile.bio);
      bioText = parsed.bio || "";
    } else {
      bioText = profile.bio || "";
    }
  } catch (e) {
    bioText = profile.bio || "";
  }
  
  const description = bioText.slice(0, 150) || `Connect with ${profile.display_name}, verified ${categoryName} content creator based in ${cityName} on Graphitex Digitals.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
  };
}

export default async function InfluencerDetailPage({ params }: InfluencerDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Check current viewer's authentication & roles
  const { data: { user } } = await supabase.auth.getUser();
  let isProvider = false;
  let isLoggedIn = !!user;

  if (user) {
    const { data: providerRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "provider")
      .maybeSingle();

    if (providerRole) {
      isProvider = true;
    }
  }

  // 2. Fetch the influencer profile with joins (supporting UUID or display name slug)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let profile = null;

  if (isUUID) {
    const { data } = await supabase
      .from("influencer_profiles")
      .select(`
        *,
        cities (name),
        states (name),
        countries (name),
        categories:niche_category_id (name)
      `)
      .eq("id", id)
      .maybeSingle();
    profile = data;
  } else {
    // A. Try direct case-insensitive space-replaced match (fast query)
    const searchName = id.replace(/-/g, " ");
    const { data } = await supabase
      .from("influencer_profiles")
      .select(`
        *,
        cities (name),
        states (name),
        countries (name),
        categories:niche_category_id (name)
      `)
      .ilike("display_name", searchName)
      .maybeSingle();

    profile = data;

    // B. Fallback to precise in-memory slug matching for special characters
    if (!profile) {
      const { data: allProfiles } = await supabase
        .from("influencer_profiles")
        .select("id, display_name")
        .eq("status", "published");

      const matching = allProfiles?.find(
        (p) => getInfluencerSlug(p.display_name) === id
      );

      if (matching) {
        const { data: fullProfile } = await supabase
          .from("influencer_profiles")
          .select(`
            *,
            cities (name),
            states (name),
            countries (name),
            categories:niche_category_id (name)
          `)
          .eq("id", matching.id)
          .maybeSingle();
        profile = fullProfile;
      }
    }
  }

  if (!profile) {
    notFound();
  }

  // 3. Fetch connected social accounts
  const { data: socials } = await supabase
    .from("influencer_social_accounts")
    .select("*")
    .eq("influencer_profile_id", profile.id)
    .order("follower_count", { ascending: false });

  // 4. Fetch all active categories to resolve niche names from niche_category_ids array
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_active", true);

  let nicheNames: string[] = [];
  if (profile.niche_category_ids && profile.niche_category_ids.length > 0) {
    nicheNames = profile.niche_category_ids
      .map((catId: number) => allCategories?.find((c) => c.id === catId)?.name)
      .filter(Boolean) as string[];
  }

  if (nicheNames.length === 0 && profile.categories?.name) {
    nicheNames = [profile.categories.name];
  }

  const mappedProfile = {
    ...profile,
    niche_category_names: nicheNames,
  };

  // 5. Check if contact has been revealed by this provider
  let hasRevealed = false;
  if (user && isProvider) {
    const { data: revealRecord } = await supabase
      .from("contact_reveal_log")
      .select("id")
      .eq("provider_user_id", user.id)
      .eq("influencer_profile_id", profile.id)
      .maybeSingle();

    if (revealRecord) {
      hasRevealed = true;
    }
  }

  // 6. Parse bio and media list from the bio column JSON string
  const rawBio = profile.bio || "";
  let bioText = rawBio;
  let mediaList: { type: "image" | "video"; url: string }[] = [];

  try {
    if (rawBio.trim().startsWith("{")) {
      const parsed = JSON.parse(rawBio);
      if (parsed && typeof parsed === "object" && "bio" in parsed) {
        bioText = parsed.bio || "";
        mediaList = Array.isArray(parsed.media) ? parsed.media : [];
      }
    }
  } catch (e) {
    // Treat as plain text, media is empty
  }

  return (
    <InfluencerProfileClient
      profile={mappedProfile}
      socials={socials ?? []}
      bioText={bioText}
      mediaList={mediaList}
      isProvider={isProvider}
      hasRevealed={hasRevealed}
      isLoggedIn={isLoggedIn}
    />
  );
}
