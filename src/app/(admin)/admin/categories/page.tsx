import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CategoryConsole from "./CategoryConsole";

export default async function AdminCategoriesPage() {
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

  // Fetch all categories (active or inactive, sorted by name)
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 style={{ color: "hsl(220,15%,90%)", marginBottom: "var(--space-6)", fontSize: "var(--text-2xl)" }}>
        Platform Categories Taxonomy ({categories?.length ?? 0})
      </h1>
      <CategoryConsole categories={categories ?? []} />
    </div>
  );
}
