import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import BusinessDetailsActions from "./BusinessDetailsActions";

export default async function AdminBusinessProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Fetch full details of the profile, joining cities, states, countries, and users
  const [profileRes, mediaRes, approvalsRes] = await Promise.all([
    supabase
      .from("business_profiles")
      .select(`
        *,
        users!business_profiles_user_id_fkey (*),
        categories (name),
        cities (name),
        states (name),
        countries (name)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("business_media")
      .select("*")
      .eq("business_profile_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("profile_approvals")
      .select("*, users (name)")
      .eq("business_profile_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileRes.data;
  const media = mediaRes.data ?? [];
  const approvals = approvalsRes.data ?? [];

  if (!profile) {
    return (
      <div style={{ color: "hsl(0, 70%, 60%)", padding: "40px", textAlign: "center" }}>
        <h2>Business Profile Not Found</h2>
        <Link href="/admin/business-profiles" style={{ color: "hsl(220, 90%, 65%)", textDecoration: "none" }}>
          ← Back to Businesses
        </Link>
      </div>
    );
  }

  return (
    <div style={{ color: "hsl(220, 15%, 85%)" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href="/admin/business-profiles" style={{ color: "hsl(220, 90%, 65%)", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Businesses
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "28px", margin: "0 0 6px 0", fontWeight: "var(--weight-bold)" }}>
              {profile.business_name}
            </h1>
            <p style={{ margin: 0, color: "hsl(220, 15%, 55%)", fontSize: "15px" }}>
              {profile.tagline || "No tagline configured."}
            </p>
          </div>
          <span style={{
            display: "inline-flex",
            padding: "6px 14px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: "var(--weight-semibold)",
            textTransform: "uppercase",
            background: profile.status === "approved" ? "hsl(145, 40%, 10%)" : profile.status === "pending_approval" ? "hsl(38, 60%, 12%)" : "hsl(0, 40%, 12%)",
            color: profile.status === "approved" ? "hsl(145, 60%, 50%)" : profile.status === "pending_approval" ? "hsl(38, 90%, 60%)" : "hsl(0, 70%, 60%)",
            border: `1px solid ${profile.status === "approved" ? "hsl(145, 40%, 20%)" : profile.status === "pending_approval" ? "hsl(38, 60%, 22%)" : "hsl(0, 40%, 22%)"}`
          }}>
            {profile.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Main Details Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* About / Description */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>About</h3>
            <p style={{ lineHeight: "1.6", whiteSpace: "pre-wrap", color: "hsl(220, 15%, 75%)", margin: 0, fontSize: "15px" }}>
              {profile.description}
            </p>
          </div>

          {/* Media Files */}
          {media.length > 0 && (
            <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>Gallery Media</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
                {media.map((m: any) => (
                  <div key={m.id} style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", borderRadius: "12px", border: "1px solid hsl(220, 18%, 20%)", background: "black" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact and Metadata */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <h4 style={{ color: "hsl(220, 15%, 50%)", margin: "0 0 6px 0", fontSize: "13px", textTransform: "uppercase" }}>Category</h4>
              <p style={{ color: "white", margin: 0, fontWeight: "var(--weight-semibold)", fontSize: "15px" }}>{profile.categories?.name || "—"}</p>
            </div>
            <div>
              <h4 style={{ color: "hsl(220, 15%, 50%)", margin: "0 0 6px 0", fontSize: "13px", textTransform: "uppercase" }}>Type</h4>
              <p style={{ color: "white", margin: 0, fontWeight: "var(--weight-semibold)", fontSize: "15px", textTransform: "capitalize" }}>{profile.provider_type.replace(/_/g, " ")}</p>
            </div>
            <div>
              <h4 style={{ color: "hsl(220, 15%, 50%)", margin: "0 0 6px 0", fontSize: "13px", textTransform: "uppercase" }}>Location</h4>
              <p style={{ color: "white", margin: 0, fontWeight: "var(--weight-semibold)", fontSize: "15px" }}>
                {profile.cities?.name}, {profile.states?.name}, {profile.countries?.name}
              </p>
            </div>
            <div>
              <h4 style={{ color: "hsl(220, 15%, 50%)", margin: "0 0 6px 0", fontSize: "13px", textTransform: "uppercase" }}>Visibility</h4>
              <p style={{ color: "white", margin: 0, fontWeight: "var(--weight-semibold)", fontSize: "15px" }}>{profile.is_public ? "Public Listing" : "Private Listing"}</p>
            </div>
            <div>
              <h4 style={{ color: "hsl(220, 15%, 50%)", margin: "0 0 6px 0", fontSize: "13px", textTransform: "uppercase" }}>WhatsApp</h4>
              <p style={{ color: "white", margin: 0, fontWeight: "var(--weight-semibold)", fontSize: "15px" }}>{profile.whatsapp_number || "—"}</p>
            </div>
            <div>
              <h4 style={{ color: "hsl(220, 15%, 50%)", margin: "0 0 6px 0", fontSize: "13px", textTransform: "uppercase" }}>Contact Number</h4>
              <p style={{ color: "white", margin: 0, fontWeight: "var(--weight-semibold)", fontSize: "15px" }}>{profile.contact_number || "—"}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Actions & Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Moderation Actions */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
              Moderation Controls
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "hsl(220, 15%, 55%)" }}>
              Act on this business profile. Actions trigger immediate alerts to the business owner.
            </p>
            <BusinessDetailsActions profileId={id} currentStatus={profile.status} />
          </div>

          {/* Provider user */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
              Provider Details
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              {profile.users?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.users.avatar_url} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", border: "1px solid hsl(220, 18%, 20%)" }} />
              ) : (
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "hsl(220, 70%, 20%)", color: "hsl(220, 90%, 70%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "var(--weight-bold)", fontSize: "18px" }}>
                  {profile.users?.name?.charAt(0).toUpperCase() || "?"}
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
                <span style={{ color: "hsl(220, 15%, 50%)" }}>Mobile: </span>
                <span style={{ color: "white" }}>{profile.users?.mobile_number}</span>
              </div>
            </div>
          </div>

          {/* Approvals History Timeline */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
              Approval History
            </h3>
            {approvals.length === 0 ? (
              <p style={{ margin: 0, fontSize: "14px", color: "hsl(220, 15%, 45%)" }}>No approval records found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {approvals.map((ap: any) => (
                  <div key={ap.id} style={{ display: "flex", gap: "10px", fontSize: "13px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: ap.decision === "approved" ? "hsl(145, 60%, 50%)" : "hsl(0, 70%, 50%)", marginTop: "4px" }} />
                      <div style={{ width: "1px", flex: 1, background: "hsl(220, 18%, 20%)", minHeight: "16px" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: "var(--weight-semibold)", color: "white" }}>
                        {ap.decision === "approved" ? "Approved" : "Rejected"}
                      </div>
                      <div style={{ color: "hsl(220, 15%, 50%)", fontSize: "11px" }}>
                        by {ap.users?.name || "System Admin"} · {new Date(ap.created_at).toLocaleDateString()}
                      </div>
                      {ap.reason && (
                        <div style={{ background: "hsl(220, 18%, 8%)", border: "1px solid hsl(220, 18%, 18%)", padding: "8px", borderRadius: "6px", marginTop: "6px", color: "hsl(220, 15%, 70%)" }}>
                          {ap.reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
