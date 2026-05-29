import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserDetailsActions from "./UserDetailsActions";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Fetch user data, user roles, business profiles, influencer profiles, and audit log entries
  const [userRes, rolesRes, businessesRes, influencerRes, auditRes] = await Promise.all([
    supabase
      .from("users")
      .select(`
        *,
        countries (name),
        states (name),
        cities (name)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", id),
    supabase
      .from("business_profiles")
      .select("id, business_name, status")
      .eq("user_id", id),
    supabase
      .from("influencer_profiles")
      .select("id, display_name, status")
      .eq("user_id", id)
      .single(),
    supabase
      .from("admin_audit_log")
      .select("id, action, created_at, admin_user_id, users!admin_user_id (name)")
      .eq("entity_type", "user")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const targetUser = userRes.data;
  const roles = (rolesRes.data ?? []).map(r => r.role);
  const businesses = businessesRes.data ?? [];
  const influencer = influencerRes.data;
  const audits = auditRes.data ?? [];

  if (!targetUser) {
    return (
      <div style={{ color: "hsl(0, 70%, 60%)", padding: "40px", textAlign: "center" }}>
        <h2>User Account Not Found</h2>
        <Link href="/admin/users" style={{ color: "hsl(220, 90%, 65%)", textDecoration: "none" }}>
          ← Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div style={{ color: "hsl(220, 15%, 85%)" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link href="/admin/users" style={{ color: "hsl(220, 90%, 65%)", textDecoration: "none", fontSize: "14px" }}>
          ← Back to Users
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {targetUser.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={targetUser.avatar_url} alt="" style={{ width: "64px", height: "64px", borderRadius: "50%", border: "1px solid hsl(220, 18%, 20%)" }} />
            ) : (
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "hsl(220, 70%, 20%)", color: "hsl(220, 90%, 70%)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "var(--weight-bold)", fontSize: "24px" }}>
                {targetUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 style={{ color: "white", fontSize: "28px", margin: "0 0 6px 0", fontWeight: "var(--weight-bold)" }}>
                {targetUser.name}
              </h1>
              <p style={{ margin: 0, color: "hsl(220, 15%, 55%)", fontSize: "15px" }}>
                Registered User Account
              </p>
            </div>
          </div>
          <span style={{
            display: "inline-flex",
            padding: "6px 14px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: "var(--weight-semibold)",
            textTransform: "uppercase",
            background: targetUser.status === "active" ? "hsl(145, 40%, 10%)" : "hsl(0, 40%, 12%)",
            color: targetUser.status === "active" ? "hsl(145, 60%, 50%)" : "hsl(0, 70%, 60%)",
            border: `1px solid ${targetUser.status === "active" ? "hsl(145, 40%, 20%)" : "hsl(0, 40%, 22%)"}`
          }}>
            {targetUser.status}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        
        {/* Main Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* User metadata properties */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Account Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "14px" }}>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Name</span>
                <span style={{ color: "white", fontWeight: "var(--weight-semibold)" }}>{targetUser.name}</span>
              </div>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Email</span>
                <span style={{ color: "white", fontWeight: "var(--weight-semibold)" }}>{targetUser.email || "—"}</span>
              </div>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Mobile Number</span>
                <span style={{ color: "white", fontWeight: "var(--weight-semibold)" }}>{targetUser.mobile_number}</span>
              </div>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Mobile Verification</span>
                <span style={{ color: targetUser.mobile_verified ? "hsl(145, 60%, 50%)" : "hsl(0, 70%, 60%)", fontWeight: "var(--weight-semibold)" }}>
                  {targetUser.mobile_verified ? "Verified" : "Unverified"}
                </span>
              </div>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Location</span>
                <span style={{ color: "white" }}>
                  {targetUser.cities?.name}, {targetUser.states?.name}, {targetUser.countries?.name}
                </span>
              </div>
              <div>
                <span style={{ color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Registration Date</span>
                <span style={{ color: "white" }}>{new Date(targetUser.created_at).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Associated Listings profiles */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Associated Directories Listings</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Influencer profile */}
              <div>
                <h4 style={{ color: "hsl(220, 15%, 50%)", fontSize: "12px", textTransform: "uppercase", margin: "0 0 8px 0" }}>Influencer Profile</h4>
                {influencer ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "hsl(220, 18%, 8%)", borderRadius: "8px", border: "1px solid hsl(220, 18%, 16%)" }}>
                    <span style={{ color: "white", fontWeight: "var(--weight-semibold)" }}>{influencer.display_name}</span>
                    <Link href={`/admin/influencers/${influencer.id}`} style={{ color: "hsl(220, 90%, 65%)", textDecoration: "none", fontSize: "13px" }}>
                      Manage Listing →
                    </Link>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "13px", color: "hsl(220, 15%, 45%)" }}>No influencer profile created.</p>
                )}
              </div>

              {/* Provider profiles */}
              <div style={{ marginTop: "8px" }}>
                <h4 style={{ color: "hsl(220, 15%, 50%)", fontSize: "12px", textTransform: "uppercase", margin: "0 0 8px 0" }}>Brand/Business Listings</h4>
                {businesses.length === 0 ? (
                  <p style={{ margin: 0, fontSize: "13px", color: "hsl(220, 15%, 45%)" }}>No business services created.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {businesses.map((b) => (
                      <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "hsl(220, 18%, 8%)", borderRadius: "8px", border: "1px solid hsl(220, 18%, 16%)" }}>
                        <span style={{ color: "white", fontWeight: "var(--weight-semibold)" }}>{b.business_name}</span>
                        <Link href={`/admin/business-profiles/${b.id}`} style={{ color: "hsl(220, 90%, 65%)", textDecoration: "none", fontSize: "13px" }}>
                          Manage Listing →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account Modification Logs */}
          <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ color: "white", marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>Account Moderation Trail</h3>
            {audits.length === 0 ? (
              <p style={{ margin: 0, fontSize: "14px", color: "hsl(220, 15%, 45%)" }}>No administrative operations logged on this user.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {audits.map((a: any) => (
                  <div key={a.id} style={{ fontSize: "13px", padding: "12px", background: "hsl(220, 18%, 8%)", borderRadius: "8px", border: "1px solid hsl(220, 18%, 16%)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "hsl(220, 15%, 55%)", marginBottom: "4px" }}>
                      <span>Action: <strong style={{ color: "white", textTransform: "capitalize" }}>{a.action.replace(/_/g, " ")}</strong></span>
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "hsl(220, 15%, 45%)" }}>Admin: {a.users?.name || "System Admin"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div>
          <UserDetailsActions userId={id} currentStatus={targetUser.status} currentRoles={roles} />
        </div>

      </div>
    </div>
  );
}
