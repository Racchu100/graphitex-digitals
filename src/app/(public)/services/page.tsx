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
  },

  // Food & Restaurants
  {
    id: "dummy-serv-10",
    business_name: "The Coastal Kitchen",
    tagline: "Authentic Mangalorean seafood, fresh local catch, and premium family dining spaces.",
    contact_type: "whatsapp",
    whatsapp_number: "919900990099",
    contact_number: "+91 99009 90099",
    categories: { name: "Food & Restaurants" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },
  {
    id: "dummy-serv-11",
    business_name: "Urban Bean Café",
    tagline: "Aesthetic specialty coffee house, organic breakfast platters, and custom workspace hubs.",
    contact_type: "whatsapp",
    whatsapp_number: "918800880088",
    contact_number: "+91 88008 80088",
    categories: { name: "Food & Restaurants" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Beauty & Wellness
  {
    id: "dummy-serv-12",
    business_name: "Zene Luxury Spa & Salon",
    tagline: "Relaxing deep tissue massages, organic bridal makeovers, and premium skincare therapies.",
    contact_type: "whatsapp",
    whatsapp_number: "917700770077",
    contact_number: "+91 77007 77007",
    categories: { name: "Beauty & Wellness" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },
  {
    id: "dummy-serv-13",
    business_name: "Aura Nails & Hair Studio",
    tagline: "Custom extensions, trending hair styling, color balayage, and aesthetic pedicures.",
    contact_type: "whatsapp",
    whatsapp_number: "916600660066",
    contact_number: "+91 66006 60066",
    categories: { name: "Beauty & Wellness" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Fitness & Gym
  {
    id: "dummy-serv-14",
    business_name: "Iron Peak Gym",
    tagline: "Modern high-end strength training center, customized nutrition coaching, and certified trainers.",
    contact_type: "whatsapp",
    whatsapp_number: "915500550055",
    contact_number: "+91 55005 50055",
    categories: { name: "Fitness & Gym" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },
  {
    id: "dummy-serv-15",
    business_name: "Prana Yoga Studio",
    tagline: "Aesthetic traditional yoga layouts, morning mindfulness courses, and spiritual wellness.",
    contact_type: "whatsapp",
    whatsapp_number: "914400440044",
    contact_number: "+91 44004 40044",
    categories: { name: "Fitness & Gym" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Real Estate
  {
    id: "dummy-serv-16",
    business_name: "Vertex Realty Group",
    tagline: "Premium seaside residential apartments, commercial workspaces, and villa brokerage.",
    contact_type: "whatsapp",
    whatsapp_number: "913300330033",
    contact_number: "+91 33003 30033",
    categories: { name: "Real Estate" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Events & Entertainment
  {
    id: "dummy-serv-17",
    business_name: "Signature Weddings & Shows",
    tagline: "Stunning themed wedding styling, sound & lighting hire, and VIP artist management.",
    contact_type: "whatsapp",
    whatsapp_number: "912200220022",
    contact_number: "+91 22002 20022",
    categories: { name: "Events & Entertainment" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Automotive
  {
    id: "dummy-serv-18",
    business_name: "Apex Auto Detailing",
    tagline: "Ultra-glossy ceramic coating, paint correction, premium wraps, and luxury wash cycles.",
    contact_type: "whatsapp",
    whatsapp_number: "911100110011",
    contact_number: "+91 11001 10011",
    categories: { name: "Automotive" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Finance & Insurance
  {
    id: "dummy-serv-19",
    business_name: "GrowWealth Advisory",
    tagline: "Strategic tax planning, mutual fund wealth allocation, and reliable insurance plans.",
    contact_type: "whatsapp",
    whatsapp_number: "910099009900",
    contact_number: "+91 00990 09900",
    categories: { name: "Finance & Insurance" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Baby & Kids
  {
    id: "dummy-serv-20",
    business_name: "Tiny Tots Boutique & Play",
    tagline: "Premium organic children wear, imported educational toys, and safe indoor playgrounds.",
    contact_type: "whatsapp",
    whatsapp_number: "910088008800",
    contact_number: "+91 00880 08800",
    categories: { name: "Baby & Kids" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1519689680058-324335c77ebe?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Pet Care
  {
    id: "dummy-serv-21",
    business_name: "Paws & Whiskers Spa",
    tagline: "Professional pet styling, customized breed grooming, and trusted dog day-care suites.",
    contact_type: "whatsapp",
    whatsapp_number: "910077007700",
    contact_number: "+91 00770 07700",
    categories: { name: "Pet Care" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Agriculture & Farming
  {
    id: "dummy-serv-22",
    business_name: "GreenEarth Plant Nursery",
    tagline: "High-grade organic plant seeds, vermicompost, exotic flower pots, and nursery advice.",
    contact_type: "whatsapp",
    whatsapp_number: "910066006600",
    contact_number: "+91 00660 06600",
    categories: { name: "Agriculture & Farming" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=600&auto=format&fit=crop", media_type: "image" }
    ]
  },

  // Jewellery & Accessories
  {
    id: "dummy-serv-23",
    business_name: "Ornate Heritage Jewellers",
    tagline: "Exquisite handcrafted traditional gold, antique silver sets, and modern diamond rings.",
    contact_type: "whatsapp",
    whatsapp_number: "910055005500",
    contact_number: "+91 00550 05500",
    categories: { name: "Jewellery & Accessories" },
    cities: { name: "Mangalore" },
    business_media: [
      { url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop", media_type: "image" }
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
  "Electronics & Appliance Repair": { desc: "Quick repair services for AC, refrigerator, washing machine, television, and home appliances.", id: "electronics-appliance-repair" },
  "Food & Restaurants": { desc: "Delicious dining options, local restaurants, cafés, catering, and gourmet culinary experiences.", id: "food-restaurants" },
  "Beauty & Wellness": { desc: "Premium beauty treatments, rejuvenating spas, skincare therapies, and local wellness hubs.", id: "beauty-wellness" },
  "Fitness & Gym": { desc: "High-performance fitness centers, personal training, yoga studios, and active lifestyle hubs.", id: "fitness-gym" },
  "Real Estate": { desc: "Trusted property consultants, premium residential listings, commercial spaces, and rental agencies.", id: "real-estate" },
  "Automotive": { desc: "Expert vehicle diagnostics, premium detailing, local car care services, and trusted garages.", id: "automotive" },
  "Finance & Insurance": { desc: "Comprehensive financial planning, wealth advisory, tax consultation, and secure insurance coverage.", id: "finance-insurance" },
  "Baby & Kids": { desc: "Premium children apparel, local playzones, educational toy stores, and baby care services.", id: "baby-kids" },
  "Pet Care": { desc: "Comprehensive pet grooming, experienced veterinary clinics, organic food supplies, and local pet boarding.", id: "pet-care" },
  "Agriculture & Farming": { desc: "High-quality organic farming supplies, premium seeds, modern agricultural tools, and local nursery guidance.", id: "agriculture-farming" },
  "Jewellery & Accessories": { desc: "Exquisite handcrafted gold and diamond jewellery, premium fashion accessories, and luxury collections.", id: "jewellery-accessories" },
  "Education & Coaching": { desc: "Top academic coaching centers, specialized professional courses, and local training institutes.", id: "education-coaching" },
  "Healthcare & Pharmacy": { desc: "Trusted medical clinics, pharmacies, diagnostic centers, and premium home healthcare services.", id: "healthcare-pharmacy" },
  "Handmade & Crafts": { desc: "Gorgeous handcrafted artisan products, bespoke clay items, woven designs, and traditional arts.", id: "handmade-crafts" },
  "Hospitality & Hotels": { desc: "Luxurious boutique hotels, homestays, premium resorts, and outstanding local guest experiences.", id: "hospitality-hotels" }
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
    <React.Suspense fallback={<div className="container" style={{ padding: "80px 0", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "14px" }}>Loading Directory...</div>}>
      <ServicesDirectoryClient 
        initialProfiles={activeProfiles}
        isDemoMode={isDemoMode}
        categoryMetadata={categoryMetadata}
      />
    </React.Suspense>
  );
}


