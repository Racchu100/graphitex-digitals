import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import OpportunityDetailsActions from "./OpportunityDetailsActions";

export default async function AdminOpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Fetch opportunity details joined with business profile, and applicant detail list
  const [oppRes, appsRes] = await Promise.all([
    supabase
      .from("opportunities")
      .select(`
        *,
        business_profiles (business_name, tagline, user_id)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("opportunity_applications")
      .select(`
        id,
        message,
        status,
        created_at,
        influencer_profiles (display_name, bio)
      `)
      .eq("opportunity_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const opp = oppRes.data;
  const apps = appsRes.data ?? [];

  if (!opp) {
    return (
      <div style={{ color: "hsl(0, 70%, 60%)", padding: "40px", textAlign: "center" }}>
        <h2>Opportunity Not Found</h2>
        <Link href="/admin/opportunities" style={{ color: "hsl(220, 90%, 65%)", textDecoration: "none" }}>
          ← Back to Opportunities
        </Link>
      </div>
    );
  }

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: opp.currency || "INR", maximumFractionDigits: 0 }).format(p);
  };

  return (
    <div style={{ color: "hsl(220, 15%, 85%)" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href="/admin/opportunities" style={{ color: "hsl(220, 90%, 65%)", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Opportunities
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "28px", margin: "0 0 6px 0", fontWeight: "var(--weight-bold)" }}>
              {opp.title}
            </h1>
            <p style={{ margin: 0, color: "hsl(220, 15%, 55%)", fontSize: "15px" }}>
              Campaign posted by {opp.business_profiles?.business_name}
            </p>
          </div>
          <span style={{
            display: "inline-flex",
            padding: "6px 14px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: "var(--weight-semibold)",
            textTransform: "uppercase",
            background: opp.status === "active" ? "hsl(145, 40%, 10%)" : opp.status === "expired" ? "hsl(220, 10%, 14%)" : "hsl(0, 40%, 12%)",
            color: opp.status === "active" ? "hsl(145, 60%, 50%)" : opp.status === "expired" ? "hsl(220, 10%, 45%)" : "hsl(0, 70%, 60%)",
            border: `1px solid ${opp.status === "active" ? "hsl(145, 40%, 20%)" : opp.status === "expired" ? "hsl(220, 10%, 20%)" : "hsl(0, 40%, 22%)"}`
          }}>
            {opp.status}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Main Details Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Campaign Description & Purpose */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>Campaign Brief</h3>
            <p style={{ lineHeight: "1.6", whiteSpace: "pre-wrap", color: "hsl(220, 15%, 75%)", margin: "0 0 20px 0", fontSize: "15px" }}>
              {opp.description}
            </p>
            <h4 style={{ color: "white", fontSize: "14px", margin: "0 0 8px 0" }}>Purpose & Goal</h4>
            <p style={{ margin: 0, color: "hsl(220, 15%, 65%)", fontSize: "14px" }}>{opp.purpose}</p>
          </div>

          {/* Applications list */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "18px" }}>Active Submissions / Applications ({apps.length})</h3>
            {apps.length === 0 ? (
              <p style={{ margin: 0, color: "hsl(220, 15%, 45%)", fontSize: "14px" }}>No applications received yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {apps.map((a: any) => (
                  <div key={a.id} style={{ padding: "16px", background: "hsl(220, 18%, 8%)", border: "1px solid hsl(220, 18%, 16%)", borderRadius: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <h4 style={{ margin: 0, color: "white", fontSize: "15px" }}>
                        {a.influencer_profiles?.display_name || "Influencer"}
                      </h4>
                      <span style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: a.status === "accepted" ? "hsl(145, 40%, 10%)" : a.status === "rejected" ? "hsl(0, 40%, 12%)" : "hsl(220, 15%, 14%)",
                        color: a.status === "accepted" ? "hsl(145, 60%, 50%)" : a.status === "rejected" ? "hsl(0, 70%, 60%)" : "hsl(220, 15%, 70%)"
                      }}>
                        {a.status}
                      </span>
                    </div>
                    {a.message && (
                      <p style={{ margin: 0, color: "hsl(220, 15%, 75%)", fontSize: "13px", lineHeight: "1.5" }}>
                        "{a.message}"
                      </p>
                    )}
                    <span style={{ display: "block", marginTop: "8px", fontSize: "11px", color: "hsl(220, 15%, 45%)" }}>
                      Applied {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Moderation Controls */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
              Moderation Controls
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "hsl(220, 15%, 55%)" }}>
              Flag and remove this campaign listing. Removal will trigger brand notifications.
            </p>
            <OpportunityDetailsActions oppId={id} currentStatus={opp.status} />
            {opp.status === "removed" && opp.removed_reason && (
              <div style={{ background: "hsl(0, 40%, 10%)", border: "1px solid hsl(0, 40%, 25%)", borderRadius: "8px", padding: "12px", marginTop: "16px", fontSize: "13px", color: "hsl(0, 70%, 65%)" }}>
                <strong>Reason:</strong> {opp.removed_reason}
              </div>
            )}
          </div>

          {/* Target details */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
              Target Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Budget Range</span>
                <span style={{ color: "white", fontSize: "15px", fontWeight: "var(--weight-bold)" }}>
                  {formatPrice(Number(opp.price_min))} – {formatPrice(Number(opp.price_max))}
                </span>
              </div>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Platform Target</span>
                <span style={{ color: "white", textTransform: "capitalize", fontWeight: "var(--weight-semibold)" }}>{opp.platform_preference}</span>
              </div>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Min Followers</span>
                <span style={{ color: "white", fontWeight: "var(--weight-semibold)" }}>{opp.min_followers.toLocaleString()} Followers</span>
              </div>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Active Windows</span>
                <span style={{ color: "white", fontSize: "12px" }}>
                  {new Date(opp.starts_at).toLocaleDateString()} to {new Date(opp.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
