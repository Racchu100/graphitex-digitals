import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import InfluencerDetailsActions from "./InfluencerDetailsActions";

export default async function AdminInfluencerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (!adminRole) redirect("/dashboard/profile");

  // Fetch influencer profile, social accounts, and reveal log counts
  const [profileRes, socialRes, revealRes] = await Promise.all([
    supabase
      .from("influencer_profiles")
      .select(`
        *,
        users (*),
        categories:niche_category_id (name),
        cities (name),
        states (name),
        countries (name)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("influencer_social_accounts")
      .select("*")
      .eq("influencer_profile_id", id)
      .order("follower_count", { ascending: false }),
    supabase
      .from("contact_reveal_log")
      .select("id", { count: "exact", head: true })
      .eq("influencer_profile_id", id),
  ]);

  const profile = profileRes.data;
  const socials = socialRes.data ?? [];
  const revealsCount = revealRes.count ?? 0;

  if (!profile) {
    return (
      <div style={{ color: "hsl(0, 70%, 60%)", padding: "40px", textAlign: "center" }}>
        <h2>Influencer Profile Not Found</h2>
        <Link href="/admin/influencers" style={{ color: "hsl(220, 90%, 65%)", textDecoration: "none" }}>
          ← Back to Influencers
        </Link>
      </div>
    );
  }

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: profile.currency || "INR", maximumFractionDigits: 0 }).format(p);
  };

  return (
    <div style={{ color: "hsl(220, 15%, 85%)" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href="/admin/influencers" style={{ color: "hsl(220, 90%, 65%)", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Influencers
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "28px", margin: "0 0 6px 0", fontWeight: "var(--weight-bold)" }}>
              {profile.display_name}
            </h1>
            <p style={{ margin: 0, color: "hsl(220, 15%, 55%)", fontSize: "15px" }}>
              Influencer Profile
            </p>
          </div>
          <span style={{
            display: "inline-flex",
            padding: "6px 14px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: "var(--weight-semibold)",
            textTransform: "uppercase",
            background: profile.status === "published" ? "hsl(145, 40%, 10%)" : profile.status === "draft" ? "hsl(220, 20%, 14%)" : "hsl(0, 40%, 12%)",
            color: profile.status === "published" ? "hsl(145, 60%, 50%)" : profile.status === "draft" ? "hsl(220, 15%, 55%)" : "hsl(0, 70%, 60%)",
            border: `1px solid ${profile.status === "published" ? "hsl(145, 40%, 20%)" : profile.status === "draft" ? "hsl(220, 18%, 20%)" : "hsl(0, 40%, 22%)"}`
          }}>
            {profile.status}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Main Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Bio / Description */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>Bio</h3>
            <p style={{ lineHeight: "1.6", whiteSpace: "pre-wrap", color: "hsl(220, 15%, 75%)", margin: 0, fontSize: "15px" }}>
              {profile.bio || "No bio description configured."}
            </p>
          </div>

          {/* Connected Social Accounts */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>Social Handles & Accounts</h3>
            {socials.length === 0 ? (
              <p style={{ margin: 0, color: "hsl(220, 15%, 45%)", fontSize: "14px" }}>No social media accounts connected.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {socials.map((sa: any) => (
                  <div key={sa.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "hsl(220, 18%, 8%)", border: "1px solid hsl(220, 18%, 16%)", borderRadius: "12px" }}>
                    <div>
                      <span style={{ textTransform: "uppercase", fontSize: "11px", fontWeight: "var(--weight-semibold)", color: sa.platform === "instagram" ? "hsl(330, 80%, 65%)" : sa.platform === "youtube" ? "hsl(0, 80%, 60%)" : "hsl(210, 80%, 55%)", border: "1px solid currentColor", padding: "2px 6px", borderRadius: "4px", marginRight: "8px" }}>
                        {sa.platform}
                      </span>
                      <a href={sa.profile_url} target="_blank" rel="noopener noreferrer" style={{ color: "white", textDecoration: "none", fontSize: "14px", fontWeight: "var(--weight-semibold)" }}>
                        {sa.handle || "@handle"}
                      </a>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "var(--weight-bold)", color: "white" }}>
                        {sa.follower_count.toLocaleString()} Followers
                      </span>
                      <span style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: sa.is_verified ? "hsl(200, 70%, 15%)" : "hsl(38, 50%, 12%)",
                        color: sa.is_verified ? "hsl(200, 90%, 60%)" : "hsl(38, 90%, 60%)"
                      }}>
                        {sa.is_verified ? "Verified Sync" : sa.count_source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Metadata info */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <h4 style={{ color: "hsl(220, 15%, 50%)", margin: "0 0 6px 0", fontSize: "13px", textTransform: "uppercase" }}>Price Range</h4>
              <p style={{ color: "white", margin: 0, fontWeight: "var(--weight-semibold)", fontSize: "15px" }}>
                {formatPrice(Number(profile.price_min))} – {formatPrice(Number(profile.price_max))}
              </p>
            </div>
            <div>
              <h4 style={{ color: "hsl(220, 15%, 50%)", margin: "0 0 6px 0", fontSize: "13px", textTransform: "uppercase" }}>Niche Category</h4>
              <p style={{ color: "white", margin: 0, fontWeight: "var(--weight-semibold)", fontSize: "15px" }}>{profile.categories?.name || "—"}</p>
            </div>
            <div>
              <h4 style={{ color: "hsl(220, 15%, 50%)", margin: "0 0 6px 0", fontSize: "13px", textTransform: "uppercase" }}>Location</h4>
              <p style={{ color: "white", margin: 0, fontWeight: "var(--weight-semibold)", fontSize: "15px" }}>
                {profile.cities?.name}, {profile.states?.name}, {profile.countries?.name}
              </p>
            </div>
            <div>
              <h4 style={{ color: "hsl(220, 15%, 50%)", margin: "0 0 6px 0", fontSize: "13px", textTransform: "uppercase" }}>Revealed Log</h4>
              <p style={{ color: "white", margin: 0, fontWeight: "var(--weight-semibold)", fontSize: "15px" }}>
                {revealsCount} Brand Reveal requests
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Moderation Panel */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
              Moderation Controls
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "hsl(220, 15%, 55%)" }}>
              Suspend or reactivate influencer listing permissions on the platform directories.
            </p>
            <InfluencerDetailsActions profileId={id} currentStatus={profile.status} />
          </div>

          {/* User Account info */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
              User Account
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              {profile.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.profile_picture_url} alt="" style={{ width: "48px", height: "64px", borderRadius: "var(--radius-md)", objectFit: "cover", border: "1px solid hsl(220, 18%, 20%)" }} />
              ) : (
                <div style={{ width: "48px", height: "64px", borderRadius: "var(--radius-md)", background: "hsl(220, 70%, 20%)", color: "hsl(220, 90%, 70%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "var(--weight-bold)", fontSize: "18px" }}>
                  {profile.display_name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 style={{ margin: 0, color: "white", fontSize: "15px", fontWeight: "var(--weight-semibold)" }}>{profile.users?.name}</h4>
                <p style={{ margin: 0, color: "hsl(220, 15%, 50%)", fontSize: "13px" }}>Joined {new Date(profile.users?.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)" }}>Email: </span>
                <span style={{ color: "white" }}>{profile.users?.email || "—"}</span>
              </div>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)" }}>Contact Phone: </span>
                <span style={{ color: "white" }}>{profile.contact_number || profile.users?.mobile_number}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
