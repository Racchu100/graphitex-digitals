import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminTable from "@/components/admin/AdminTable";
import Link from "next/link";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRole } = await supabase
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
  if (!adminRole) redirect("/dashboard/profile");

  const { data: users } = await supabase
    .from("users")
    .select("id, name, mobile_number, status, created_at, user_roles!user_id(role)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 style={{ color: "hsl(220,15%,90%)", marginBottom: "var(--space-6)" }}>
        Users ({users?.length ?? 0})
      </h1>
      <AdminTable
        columns={["Name", "Mobile", "Roles", "Status", "Joined", "Actions"]}
        rows={(users ?? []).map(u => ({
          name: u.name,
          mobile: u.mobile_number,
          roles: (u.user_roles as any[])?.map((r: any) => r.role).join(", ") || "—",
          status: u.status,
          joined: new Date(u.created_at).toLocaleDateString("en-IN"),
          actions: `/admin/users/${u.id}`,
        }))}
      />
    </div>
  );
}
