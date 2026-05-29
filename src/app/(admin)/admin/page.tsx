import React from "react";
import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRole } = await supabase
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRole) redirect("/dashboard/profile");

  // Fetch stats in parallel
  const [pending, active, users, opps, recentPending, recentAudit] = await Promise.all([
    supabase.from("business_profiles").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
    supabase.from("business_profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("business_profiles").select("id, business_name, created_at").eq("status", "pending_approval").order("created_at", { ascending: false }).limit(5),
    supabase.from("admin_audit_log").select("id, action, entity_type, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const stats = [
    { label: "Pending Approvals", value: pending.count ?? 0, color: styles.amber, href: "/admin/approvals" },
    { label: "Active Services", value: active.count ?? 0, color: styles.green, href: "/admin/business-profiles" },
    { label: "Total Users", value: users.count ?? 0, color: styles.blue, href: "/admin/users" },
    { label: "Active Opportunities", value: opps.count ?? 0, color: styles.purple, href: "/admin/opportunities" },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Admin Dashboard</h1>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {stats.map(s => (
          <Link key={s.label} href={s.href} className={`${styles.statCard} ${s.color}`}>
            <span className={styles.statValue}>{s.value.toLocaleString()}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </Link>
        ))}
      </div>

      <div className={styles.panels}>
        {/* Recent Pending Approvals */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Pending Approvals</h2>
            <Link href="/admin/approvals" className={styles.seeAll}>See all →</Link>
          </div>
          {!recentPending.data?.length ? (
            <p className={styles.empty}>No pending approvals</p>
          ) : (
            <div className={styles.list}>
              {recentPending.data.map((bp: any) => (
                <Link key={bp.id} href={`/admin/approvals`} className={styles.listRow}>
                  <span className={styles.rowTitle}>{bp.business_name}</span>
                  <span className={styles.rowMeta}>{new Date(bp.created_at).toLocaleDateString()}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Audit Log */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Recent Actions</h2>
            <Link href="/admin/audit-log" className={styles.seeAll}>See all →</Link>
          </div>
          {!recentAudit.data?.length ? (
            <p className={styles.empty}>No audit entries yet</p>
          ) : (
            <div className={styles.list}>
              {recentAudit.data.map((log: any) => (
                <div key={log.id} className={styles.listRow}>
                  <span className={styles.rowTitle} style={{ textTransform: 'capitalize' }}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className={styles.rowMeta}>{log.entity_type} · {new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
