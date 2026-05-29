import React from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ServiceProfileClient from "./ServiceProfileClient";
import { getInfluencerSlug } from "@/lib/utils/slug";

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
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
