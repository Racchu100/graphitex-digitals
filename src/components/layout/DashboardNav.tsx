"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./DashboardNav.module.css";
import { useRoles } from "@/hooks/useRoles";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { LogOut, Trash2, User, Briefcase, FileText, Lock, ArrowLeft } from "lucide-react";

export default function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isProvider, isInfluencer, isAdmin } = useRoles();
  const supabase = createClient();
  const { user } = useUser();
  const [oppNotifsCount, setOppNotifsCount] = useState(0);
  const [appNotifsCount, setAppNotifsCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("do you want to log out");
    if (!confirmLogout) return;

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Failed to log out cleanly:", err);
    } finally {
      // Defensively clear local and session cache storage
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("graphitex_cached_user");
          window.sessionStorage.clear();
        }
      } catch (e) {}
      window.location.href = "/login";
    }
  };

  const handleDeleteAccount = async () => {
    const firstConfirm = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and all associated data, including profiles, media, opportunities, and applications. This action is IRREVERSIBLE.\n\nAre you sure you want to proceed?"
    );
    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "🔥 FINAL CONFIRMATION: Are you absolutely certain you want to delete your account permanently? All data will be deleted instantly."
    );
    if (!secondConfirm) return;

    try {
      setIsDeleting(true);
      const res = await fetch("/api/users/me", {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete account");
      }

      alert("Your account has been deleted successfully.");
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    async function fetchCounts() {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("type, is_read")
          .eq("user_id", user!.id)
          .eq("is_read", false);

        if (error) throw error;

        const appCount = data?.filter((n: any) => 
          n.type === "application_contacted" || 
          n.type === "application_accepted" || 
          n.type === "application_rejected"
        ).length || 0;

        setAppNotifsCount(appCount);

        if (!isProvider) {
          const oppCount = data?.filter((n: any) => n.type === "new_application").length || 0;
          setOppNotifsCount(oppCount);
        }
      } catch (err) {
        console.warn("Failed to fetch sidebar notification counts:", err);
      }
    }

    async function fetchPendingCount() {
      if (!isProvider) return;
      try {
        const { data: opps, error: oppsError } = await supabase
          .from('opportunities')
          .select('id')
          .eq('posted_by_user_id', user!.id);

        if (oppsError) throw oppsError;
        if (!opps || opps.length === 0) {
          setOppNotifsCount(0);
          return;
        }

        const oppIds = opps.map((o: any) => o.id);
        const { count, error: countError } = await supabase
          .from('opportunity_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'applied')
          .in('opportunity_id', oppIds);

        if (countError) throw countError;
        setOppNotifsCount(count || 0);
      } catch (err) {
        console.warn("Failed to fetch pending applications count for sidebar:", err);
      }
    }

    fetchCounts();
    if (isProvider) {
      fetchPendingCount();
    }

    // Subscribe to realtime database changes
    const channel = supabase
      .channel(`sidebar-notifs-${user!.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user!.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    let appChannel: any = null;
    if (isProvider) {
      appChannel = supabase
        .channel(`sidebar-opp-apps-${user!.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "opportunity_applications",
          },
          () => {
            fetchPendingCount();
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(channel);
      if (appChannel) {
        supabase.removeChannel(appChannel);
      }
    };
  }, [user, isProvider, supabase]);

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        <button
          onClick={() => {
            if (isProvider) {
              router.push("/influencers");
            } else {
              router.back();
            }
          }}
          className={`${styles.link} ${styles.backLinkBtn}`}
          style={{
            cursor: "pointer",
            border: "none",
            background: "none",
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-1-5, 6px)",
            padding: "5px 10px",
          }}
          title="Back"
          aria-label="Go back"
        >
          <ArrowLeft size={12} className={styles.backIcon} />
          <span className={styles.backText}>Back</span>
        </button>

        <Link 
          href="/dashboard/profile" 
          className={`${styles.link} ${pathname === "/dashboard/profile" ? styles.active : ""}`}
        >
          <User size={18} />
          <span>My Profile</span>
        </Link>
        
        {isProvider && (
          <Link 
            href="/dashboard/opportunities" 
            className={`${styles.link} ${pathname.startsWith("/dashboard/opportunities") ? styles.active : ""}`}
          >
            <Briefcase size={18} />
            <span>My Opportunities</span>
            {oppNotifsCount > 0 && (
              <span className={styles.badge}>{oppNotifsCount}</span>
            )}
          </Link>
        )}
        
        {isInfluencer && (
          <Link 
            href="/dashboard/applications" 
            className={`${styles.link} ${pathname.startsWith("/dashboard/applications") ? styles.active : ""}`}
          >
            <FileText size={18} />
            <span>My Applications</span>
            {appNotifsCount > 0 && (
              <span className={styles.badge}>{appNotifsCount}</span>
            )}
          </Link>
        )}
        
        {isAdmin && (
          <Link 
            href="/admin" 
            className={`${styles.link} ${pathname.startsWith("/admin") ? styles.active : ""}`}
          >
            <Lock size={18} />
            <span>Admin Panel</span>
          </Link>
        )}
      </nav>

      <div className={styles.footer}>
        <button 
          onClick={handleLogout} 
          className={styles.footerButton}
          disabled={isDeleting}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        <button 
          onClick={handleDeleteAccount} 
          className={`${styles.footerButton} ${styles.deleteButton}`}
          disabled={isDeleting}
        >
          <Trash2 size={18} />
          <span>{isDeleting ? "Deleting..." : "Delete Account"}</span>
        </button>
      </div>
    </aside>
  );
}
