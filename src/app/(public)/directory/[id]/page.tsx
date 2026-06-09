import React from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ServiceProfileClient from "@/app/(public)/services/[id]/ServiceProfileClient";
import { getInfluencerSlug } from "@/lib/utils/slug";
import type { Metadata } from "next";

interface DirectoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DirectoryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let profile = null;

  if (isUUID) {
    const { data } = await supabase
      .from("business_profiles")
      .select("business_name, tagline, categories(name), cities(name)")
      .eq("id", id)
      .maybeSingle();
    profile = data;
  } else {
    const { data: allProfiles } = await supabase
      .from("business_profiles")
      .select("business_name, tagline, categories(name), cities(name)")
      .eq("status", "approved")
      .eq("is_public", true);

    const matching = allProfiles?.find(
      (p) => getInfluencerSlug(p.business_name) === id
    );
    if (matching) {
      profile = matching;
    }
  }

  if (!profile) {
    return {
      title: "Business Profile | Directory",
    };
  }

  const categoryName = (Array.isArray(profile.categories) ? profile.categories[0]?.name : (profile.categories as any)?.name) || "Services";
  const cityName = (Array.isArray(profile.cities) ? profile.cities[0]?.name : (profile.cities as any)?.name) || "Mangalore";
  const title = `${profile.business_name} - ${categoryName} in ${cityName}`;
  const description = profile.tagline || `Discover ${profile.business_name}, offering premium ${categoryName} services in ${cityName} on Graphitex Digitals.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function DirectoryDetailPage({ params }: DirectoryDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch the business profile with joins (supporting UUID or slugified name)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let profile = null;

  if (isUUID) {
    const { data } = await supabase
      .from("business_profiles")
      .select(`
        *,
        categories (name),
        cities (name),
        states (name),
        countries (name)
      `)
      .eq("id", id)
      .maybeSingle();
    profile = data;
  } else {
    // A. Fetch all public approved profiles to do a precise slug match
    const { data: allProfiles } = await supabase
      .from("business_profiles")
      .select(`
        *,
        categories (name),
        cities (name),
        states (name),
        countries (name)
      `)
      .eq("status", "approved")
      .eq("is_public", true);

    const matching = allProfiles?.find(
      (p) => getInfluencerSlug(p.business_name) === id
    );

    if (matching) {
      profile = matching;
    }
  }

  if (!profile) {
    notFound();
  }

  // 2. Fetch business media sorted by sort_order
  const { data: media } = await supabase
    .from("business_media")
    .select("*")
    .eq("business_profile_id", profile.id)
    .order("sort_order", { ascending: true });

  return (
    <ServiceProfileClient
      profile={profile}
      media={media ?? []}
    />
  );
}
