import React from "react";
import ServicesDirectoryClient from "@/components/directory/ServicesDirectoryClient";
import { createClient } from "@/lib/supabase/server";

// Fallback dummy data mapped directly to standard seeded categories for visual aesthetics
const dummyServices = [
  // Photography & Video
  {
    id: "dummy-serv-1",
    business_name: "Aura Creative Studio",
    tagline: "Premium commercial product photography & performance video production.",
    contact_type: "whatsapp",
    whatsapp_number: "919999999999",
    contact_number: "+91 99999 99999",
    categories: { name: "Photography & Video" },
    cities: { name: "Bengaluru" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },
  {
    id: "dummy-serv-2",
    business_name: "Cinematic Edge Labs",
    tagline: "High-fidelity commercial promotions, corporate shoots, and high-converting video ads.",
    contact_type: "whatsapp",
    whatsapp_number: "918888888888",
    contact_number: "+91 88888 88888",
    categories: { name: "Photography & Video" },
    cities: { name: "Mumbai" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Fashion & Clothing
  {
    id: "dummy-serv-3",
    business_name: "Vivid Design & Brand Co.",
    tagline: "Modern corporate brand identity, custom vector logos, and premium fashion branding.",
    contact_type: "whatsapp",
    whatsapp_number: "917777777777",
    contact_number: "+91 77777 77777",
    categories: { name: "Fashion & Clothing" },
    cities: { name: "Delhi" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },
  {
    id: "dummy-serv-4",
    business_name: "Canvas & Pixel Creative",
    tagline: "Stunning lookbook templates, aesthetic packaging designs, and clothing print vectors.",
    contact_type: "whatsapp",
    whatsapp_number: "916666666666",
    contact_number: "+91 66666 66666",
    categories: { name: "Fashion & Clothing" },
    cities: { name: "Bengaluru" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Technology & Gadgets
  {
    id: "dummy-serv-5",
    business_name: "Apex Web Labs",
    tagline: "Modern, ultra-fast ecommerce storefronts and custom Next.js web applications.",
    contact_type: "whatsapp",
    whatsapp_number: "915555555555",
    contact_number: "+91 55555 55555",
    categories: { name: "Technology & Gadgets" },
    cities: { name: "Pune" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },
  {
    id: "dummy-serv-6",
    business_name: "ByteCraft Software",
    tagline: "Strategic enterprise portal coding, API integration, and mobile app delivery.",
    contact_type: "whatsapp",
    whatsapp_number: "914444444444",
    contact_number: "+91 44444 44444",
    categories: { name: "Technology & Gadgets" },
    cities: { name: "Hyderabad" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Home & Interior
  {
    id: "dummy-serv-7",
    business_name: "Habitat Studio",
    tagline: "Eco-friendly, contemporary interior space styling and 3D architectural renders.",
    contact_type: "whatsapp",
    whatsapp_number: "913333333333",
    contact_number: "+91 33333 33333",
    categories: { name: "Home & Interior" },
    cities: { name: "Goa" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },
  {
    id: "dummy-serv-8",
    business_name: "Vantage Decor",
    tagline: "Premium luxury residence design, custom furniture sourcing, and lighting plans.",
    contact_type: "whatsapp",
    whatsapp_number: "912222222222",
    contact_number: "+91 22222 22222",
    categories: { name: "Home & Interior" },
    cities: { name: "Chennai" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Travel & Tourism
  {
    id: "dummy-serv-9",
    business_name: "Wanderlust Marketing",
    tagline: "Destination branding campaigns, boutique hotel promotions, and creator-led travel shoots.",
    contact_type: "whatsapp",
    whatsapp_number: "919000000000",
    contact_number: "+91 90000 00000",
    categories: { name: "Travel & Tourism" },
    cities: { name: "Panaji" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  }
];

// Descriptive mappings for standard seeded categories to guarantee premium copy
const categoryMetadata: Record<string, { desc: string; id: string }> = {
  "Photography & Video": { desc: "Professional camera shoots, commercial advertising, and stunning video productions.", id: "photography-video" },
  "Fashion & Clothing": { desc: "Premium brand identities, apparel launch aesthetics, and creative clothing lookbooks.", id: "fashion-clothing" },
  "Technology & Gadgets": { desc: "High-performance web applications, custom ecommerce stores, and complex system solutions.", id: "technology-gadgets" },
  "Home & Interior": { desc: "Modern architectural space layouting, luxury interior design, and bespoke styling.", id: "home-interior" },
  "Travel & Tourism": { desc: "High-engagement destination video campaigns and boutique hotel catalog promotions.", id: "travel-tourism" },
  "Events & Entertainment": { desc: "Bespoke product runway events, celebrity media PR, and corporate brand experiences.", id: "events-entertainment" },
  "Home & Electricals": { desc: "Expert home repair, wiring, switchboards, lighting installations, and trusted local electrical services.", id: "home-electricals" },
  "Home & Electrical Services": { desc: "Expert inverter service, home wiring, UPS installation, board repairs, and trusted local electrical services.", id: "home-electrical-services" },
  "Spa & Salons": { desc: "Relaxing massage therapies, premium hair salons, facials, pedicures, and professional wellness spa sessions.", id: "spa-salons" },
  "Plumbing & Sanitary": { desc: "Professional leak repairs, pipe installations, tap fixes, drain cleaning, and sanitary fittings.", id: "plumbing-sanitary" },
  "Cleaning & Pest Control": { desc: "Comprehensive home deep cleaning, kitchen sanitization, sofa cleaning, and safe pest control services.", id: "cleaning-pest-control" },
  "Packers & Movers": { desc: "Stress-free home shifting, office relocation, safe packing, loading, and trusted logistics transfer.", id: "packers-movers" },
  "Electronics & Appliance Repair": { desc: "Quick repair services for AC, refrigerator, washing machine, television, and home appliances.", id: "electronics-appliance-repair" }
};

export default async function ServicesDirectoryPage() {
  const supabase = await createClient();

  // Fetch approved + public business profiles from the actual DB
  const { data: profiles, error } = await supabase
    .from('business_profiles')
    .select(`
      *,
      categories(name),
      cities(name),
      states(name),
      business_media(url, media_type, sort_order)
    `)
    .eq('status', 'approved')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching services:", error);
  }

  // Fall back to detailed seed-compatible dummy data if database has no active rows
  const activeProfiles = profiles && profiles.length > 0 ? profiles : dummyServices;
  const isDemoMode = !profiles || profiles.length === 0;

  return (
    <ServicesDirectoryClient 
      initialProfiles={activeProfiles}
      isDemoMode={isDemoMode}
      categoryMetadata={categoryMetadata}
    />
  );
}


