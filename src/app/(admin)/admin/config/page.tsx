import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ConfigConsole from "./ConfigConsole";

export default async function AdminConfigPage() {
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

  // Fetch all configuration keys from database
  const { data: configs } = await supabase
    .from("platform_config")
    .select("*")
    .order("key", { ascending: true });

  return (
    <div>
      <h1 style={{ color: "hsl(220,15%,90%)", marginBottom: "var(--space-6)", fontSize: "var(--text-2xl)" }}>
        Platform Settings Dashboard
      </h1>
      <ConfigConsole configs={configs ?? []} />
    </div>
  );
}
