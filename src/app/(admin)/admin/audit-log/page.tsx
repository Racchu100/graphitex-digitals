import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminAuditLogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRole } = await supabase
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRole) redirect("/dashboard/profile");

  const { data: logs } = await supabase
    .from("admin_audit_log")
    .select("*, users(name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 style={{ color: "hsl(220,15%,90%)", marginBottom: "var(--space-6)" }}>Audit Log</h1>
      
      <div style={{
        background: "hsl(220,18%,12%)",
        border: "1px solid hsl(220,18%,18%)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "hsl(220,18%,10%)", borderBottom: "1px solid hsl(220,18%,18%)" }}>
              {["Admin", "Action", "Entity", "Entity ID", "Timestamp"].map(col => (
                <th key={col} style={{
                  textAlign: "left",
                  padding: "var(--space-3) var(--space-4)",
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-semibold)",
                  color: "hsl(220,15%,55%)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em"
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log: any) => (
              <tr key={log.id} style={{
                borderBottom: "1px solid hsl(220,18%,15%)",
                transition: "background 0.1s"
              }}>
                <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "hsl(220,15%,75%)" }}>
                  {log.users?.name || "—"}
                </td>
                <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "hsl(220,90%,70%)", textTransform: "capitalize" }}>
                  {log.action.replace(/_/g, " ")}
                </td>
                <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-xs)", color: "hsl(220,15%,55%)" }}>
                  {log.entity_type}
                </td>
                <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)", color: "hsl(220,15%,45%)" }}>
                  {log.entity_id.slice(0, 12)}…
                </td>
                <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-xs)", color: "hsl(220,15%,45%)", whiteSpace: "nowrap" }}>
                  {new Date(log.created_at).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!logs || logs.length === 0) && (
          <div style={{ textAlign: "center", padding: "var(--space-16)", color: "hsl(220,15%,45%)", fontSize: "var(--text-sm)" }}>
            No audit entries yet.
          </div>
        )}
      </div>
    </div>
  );
}
