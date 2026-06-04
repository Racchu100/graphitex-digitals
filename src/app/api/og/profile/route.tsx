import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInfluencerSlug } from "@/lib/utils/slug";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type") || "influencer";

    if (!id) {
      return new Response("Missing id parameter", { status: 400 });
    }

    const supabase = await createClient();
    let name = "";
    let role = "";
    let location = "";
    let imageUrl = "";
    let followerText = "";
    let categoryText = "";

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (type === "influencer") {
      let profile = null;
      if (isUUID) {
        const { data } = await supabase
          .from("influencer_profiles")
          .select("id, display_name, profile_picture_url, cities(name), states(name)")
          .eq("id", id)
          .maybeSingle();
        profile = data;
      } else {
        const searchName = id.replace(/-/g, " ");
        const { data } = await supabase
          .from("influencer_profiles")
          .select("id, display_name, profile_picture_url, cities(name), states(name)")
          .ilike("display_name", searchName)
          .maybeSingle();
        profile = data;

        if (!profile) {
          const { data: allProfiles } = await supabase
            .from("influencer_profiles")
            .select("id, display_name, profile_picture_url, cities(name), states(name)")
            .eq("status", "published");

          const matching = allProfiles?.find(
            (p: any) => getInfluencerSlug(p.display_name) === id
          );

          if (matching) {
            profile = matching;
          }
        }
      }

      if (profile) {
        name = profile.display_name;
        role = "Influencer";
        const cityName = (profile.cities as any)?.name;
        const stateName = (profile.states as any)?.name;
        location = cityName ? `${cityName}${stateName ? `, ${stateName}` : ""}` : "";
        imageUrl = profile.profile_picture_url;

        // Fetch influencer socials to compute total followers count
        const { data: socials } = await supabase
          .from("influencer_social_accounts")
          .select("follower_count")
          .eq("influencer_profile_id", profile.id);

        const totalFollowers = socials
          ? socials.reduce((sum: number, s: any) => sum + Number(s.follower_count || 0), 0)
          : 0;

        if (totalFollowers > 0) {
          if (totalFollowers >= 1000000) {
            followerText = (totalFollowers / 1000000).toFixed(1).replace(/\.0$/, "") + "M Followers";
          } else if (totalFollowers >= 1000) {
            followerText = (totalFollowers / 1000).toFixed(1).replace(/\.0$/, "") + "K Followers";
          } else {
            followerText = totalFollowers.toLocaleString() + " Followers";
          }
        }
      }
    } else {
      // service or business
      let profile = null;
      if (isUUID) {
        const { data } = await supabase
          .from("business_profiles")
          .select("id, business_name, provider_type, cities(name), states(name), categories(name)")
          .eq("id", id)
          .maybeSingle();
        profile = data;
      } else {
        const { data: allProfiles } = await supabase
          .from("business_profiles")
          .select("id, business_name, provider_type, cities(name), states(name), categories(name)")
          .eq("status", "approved")
          .eq("is_public", true);

        const matching = allProfiles?.find(
          (p: any) => getInfluencerSlug(p.business_name) === id
        );

        if (matching) {
          profile = matching;
        }
      }

      if (profile) {
        name = profile.business_name;
        role = profile.provider_type === "business_owner" ? "Business Owner" : 
               profile.provider_type === "freelancer" ? "Freelancer" : "Local Business";
        const cityName = (profile.cities as any)?.name;
        const stateName = (profile.states as any)?.name;
        location = cityName ? `${cityName}${stateName ? `, ${stateName}` : ""}` : "";
        categoryText = (profile.categories as any)?.name || "";

        // Fetch primary image from business_media
        const { data: media } = await supabase
          .from("business_media")
          .select("url")
          .eq("business_profile_id", profile.id)
          .order("sort_order", { ascending: true })
          .limit(1);

        imageUrl = media?.[0]?.url;
      }
    }

    // Fallbacks
    if (!name) {
      name = "Graphitex Creator";
      role = type === "influencer" ? "Influencer" : "Business Owner";
    }

    if (!imageUrl) {
      imageUrl = type === "influencer"
        ? "https://raw.githubusercontent.com/Racchu100/graphitex-digitals/main/public/placeholder-avatar.svg"
        : "https://raw.githubusercontent.com/Racchu100/graphitex-digitals/main/public/placeholder-service.jpg";
    }

    // Resolve relative image URLs to absolute ones
    if (imageUrl.startsWith("/")) {
      imageUrl = new URL(imageUrl, req.url).toString();
    }

    // Load Graphitex Logo absolute URL
    const logoUrl = new URL("/logo.png", req.url).toString();

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "stretch",
            backgroundColor: "#0a0a0f",
            position: "relative",
            fontFamily: "sans-serif",
            overflow: "hidden",
          }}
        >
          {/* Background Image */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "1200px",
                height: "630px",
                objectFit: "cover",
                filter: "brightness(0.85)",
              }}
            />
          )}

          {/* Top Header Row (Logo at top left) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "40px 50px",
              position: "relative",
              zIndex: 10,
            }}
          >
            {/* logo container with premium styling */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(10, 10, 15, 0.9)",
                border: "1.5px solid rgba(255, 255, 255, 0.2)",
                padding: "10px 24px",
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              <img
                src={logoUrl}
                alt="Graphitex Logo"
                style={{
                  height: "32px",
                }}
              />
            </div>
          </div>

          {/* Floating Glassmorphic Details Card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              margin: "0 50px 40px 50px",
              padding: "36px 44px",
              backgroundColor: "rgba(10, 10, 15, 0.88)",
              border: "1.5px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "24px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              zIndex: 10,
            }}
          >
            {/* Meta Row (Role, Followers, Location) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  backgroundColor: "hsl(263, 60%, 50%)",
                  color: "#ffffff",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  boxShadow: "0 4px 10px rgba(136, 36, 238, 0.2)",
                }}
              >
                {role}
              </span>

              {followerText && (
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "hsl(142, 70%, 45%)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  • 👥 {followerText}
                </span>
              )}

              {categoryText && !followerText && (
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "hsl(263, 65%, 65%)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  • {categoryText}
                </span>
              )}

              {location && (
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "rgba(255, 255, 255, 0.8)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  • 📍 {location}
                </span>
              )}
            </div>

            {/* Display Name */}
            <h1
              style={{
                fontSize: "56px",
                fontWeight: 800,
                color: "#ffffff",
                margin: 0,
                letterSpacing: "-0.02em",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                lineHeight: 1.1,
              }}
            >
              {name}
            </h1>

            {/* Subtext description */}
            <p
              style={{
                fontSize: "18px",
                color: "rgba(255, 255, 255, 0.5)",
                margin: "10px 0 0 0",
                fontWeight: 500,
              }}
            >
              Connect and collaborate on Graphitex Digitals — India's Creative Marketplace for Businesses & Creators.
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error("OG generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
