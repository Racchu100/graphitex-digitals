import React from "react";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ServiceProfileClient from "./ServiceProfileClient";
import { getInfluencerSlug } from "@/lib/utils/slug";

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let profile = null;

  if (isUUID) {
    const { data } = await supabase
      .from("business_profiles")
      .select(`
        id,
        business_name,
        tagline,
        provider_type,
        categories (name),
        cities (name),
        states (name)
      `)
      .eq("id", id)
      .maybeSingle();
    profile = data;
  } else {
    const { data: allProfiles } = await supabase
      .from("business_profiles")
      .select(`
        id,
        business_name,
        tagline,
        provider_type,
        categories (name),
        cities (name),
        states (name)
      `)
      .eq("status", "approved")
      .eq("is_public", true);

    const matching = allProfiles?.find(
      (p: any) => getInfluencerSlug(p.business_name) === id
    );

    if (matching) {
      profile = matching;
    }
  }

  if (!profile) {
    return {
      title: "Service Profile | Graphitex Digitals",
    };
  }

  // Fetch primary image
  const { data: media } = await supabase
    .from("business_media")
    .select("url")
    .eq("business_profile_id", profile.id)
    .order("sort_order", { ascending: true })
    .limit(1);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? process.env.NEXT_PUBLIC_APP_URL 
    : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const ogImageUrl = `${baseUrl}/api/og/profile?id=${profile.id}&type=service`;

  const name = profile.business_name;
  const roleLabel = profile.provider_type === "business_owner" ? "Business Owner" : 
                    profile.provider_type === "freelancer" ? "Freelancer" : "Local Business";
  
  const categoryName = (profile.categories as any)?.name || "Service Provider";
  const cityName = (profile.cities as any)?.name;
  const stateName = (profile.states as any)?.name;
  const locationText = cityName ? ` in ${cityName}${stateName ? `, ${stateName}` : ""}` : "";
  
  const title = `${name} | ${roleLabel} | Graphitex Digitals`;
  const description = profile.tagline 
    ? `${name} (${roleLabel} - ${categoryName}${locationText}): "${profile.tagline}". Connect and collaborate on Graphitex Digitals!`
    : `Check out ${name} (${roleLabel} - ${categoryName}${locationText}) on Graphitex Digitals! Browse services, gallery, and connect directly.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${name} - ${roleLabel}`,
        }
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    }
  };
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
