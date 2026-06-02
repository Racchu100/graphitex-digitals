import React from "react";
import OpportunitiesDirectoryClient from "@/components/directory/OpportunitiesDirectoryClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Fallback dummy data for visual aesthetics until at least 1 actual record is created in the database
const dummyOpps = [
  {
    id: "dummy-opp-1",
    title: "Summer Resort Launch Video Campaign",
    purpose: "Seeking 3 high-aesthetic travel content creators to visit our boutique resort in Goa and create promotional video reels.",
    expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    price_min: 25000,
    price_max: 45000,
    currency: "Rs.",
    min_followers: 50000,
    platform_preference: "instagram",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    business_profiles: {
      business_name: "Elysian Resort & Spa",
      category_id: 3,
      categories: { id: 3, name: "Travel & Tourism" },
      business_media: [
        { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=300&auto=format&fit=crop" }
      ]
    }
  },
  {
    id: "dummy-opp-2",
    title: "E-Commerce Fashion Model Shoot",
    purpose: "Urgent recruitment for commercial product shoots. Bengaluru creators needed for clothing brand launches.",
    expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    price_min: 15000,
    price_max: 30000,
    currency: "Rs.",
    min_followers: 15000,
    platform_preference: "instagram",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    business_profiles: {
      business_name: "Threads & Co.",
      category_id: 1,
      categories: { id: 1, name: "Fashion & Clothing" },
      business_media: [
        { url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=300&auto=format&fit=crop" }
      ]
    }
  },
  {
    id: "dummy-opp-3",
    title: "Commercial Smartwatch Launch Promo",
    purpose: "Tech content creators required for commercial unboxing and comprehensive feature demonstration reels.",
    expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    price_min: 40000,
    price_max: 80000,
    currency: "Rs.",
    min_followers: 100000,
    platform_preference: "instagram",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    business_profiles: {
      business_name: "Apex Electronics",
      category_id: 2,
      categories: { id: 2, name: "Technology & Gadgets" },
      business_media: [
        { url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=300&auto=format&fit=crop" }
      ]
    }
  }
];

export default async function OpportunitiesDirectoryPage() {
  const supabase = await createClient();

  // 1. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirect=/opportunities");
  }

  // 2. Fetch the user roles to verify access
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const hasValidRole = roles?.some(r => r.role === "influencer" || r.role === "provider");

  if (!hasValidRole) {
    redirect("/onboarding");
  }

  // Fetch opportunities from the actual DB
  const { data: opps, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      business_profiles (
        business_name,
        category_id,
        categories (id, name),
        business_media (url, media_type)
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching opportunities:", error);
  }

  // If there are zero listings in the database, fall back to our premium dummy data so UI is beautiful
  const activeOpps = opps && opps.length > 0 ? opps : dummyOpps;
  const isDemoMode = !opps || opps.length === 0;

  return (
    <OpportunitiesDirectoryClient 
      initialOpps={activeOpps}
      isDemoMode={isDemoMode}
    />
  );
}

