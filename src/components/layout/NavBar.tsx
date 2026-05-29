"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./NavBar.module.css";
import Button from "@/components/ui/Button";
import { useUser } from "@/hooks/useUser";
import Logo from "@/components/layout/Logo";
import { createClient } from "@/lib/supabase/client";
import { Mail, Phone, MapPin, LogOut, LayoutDashboard, ChevronRight, CheckCircle2, XCircle, PlusCircle, Menu, X, User, LogIn } from "lucide-react";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { user, roles, loading } = useUser();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Body overflow lock when mobile navigation drawer is active
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Click outside handling to close dropdown automatically
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);

  const isProvider = Array.isArray(roles) && roles.some(r => r?.role === 'provider');
  const displayCount = isProvider ? pendingApplicationsCount : unreadCount;

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setActiveToast(null);
      setPendingApplicationsCount(0);
      return;
    }

    async function fetchNotifications() {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user!.id)
          .eq("is_read", false)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
        
        const unread = data?.filter((n: any) => !n.is_read) || [];
        setUnreadCount(unread.length);

        // Find if there is any unread approved/rejected critical notification
        const criticalNotif = unread.find((n: any) => 
          n.type === "profile_approved" || 
          n.type === "profile_rejected" || 
          n.type === "profile_suspended" || 
          n.type === "profile_reactivated" || 
          n.type === "application_accepted" || 
          n.type === "application_rejected" || 
          n.type === "new_application" || 
          n.type === "opportunity_removed"
        );

        if (criticalNotif) {
          setActiveToast(criticalNotif);
        } else {
          setActiveToast(null);
        }
      } catch (err) {
        console.warn("Failed to fetch notifications:", err);
      }
    }

    async function fetchPendingApplicationsCount() {
      if (!isProvider) return;
      try {
        const { data: opps, error: oppsError } = await supabase
          .from('opportunities')
          .select('id')
          .eq('posted_by_user_id', user!.id);

        if (oppsError) throw oppsError;
        if (!opps || opps.length === 0) {
          setPendingApplicationsCount(0);
          return;
        }

        const oppIds = opps.map((o: any) => o.id);
        const { count, error: countError } = await supabase
          .from('opportunity_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'applied')
          .in('opportunity_id', oppIds);

        if (countError) throw countError;
        setPendingApplicationsCount(count || 0);
      } catch (err) {
        console.warn("Failed to fetch pending applications count:", err);
      }
    }

    fetchNotifications();
    fetchPendingApplicationsCount();

    // Subscribe to real-time notification changes
    const channel = supabase
      .channel(`navbar-notifs-${user!.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user!.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    // Subscribe to real-time opportunity application changes
    let appChannel: any = null;
    if (isProvider) {
      appChannel = supabase
        .channel(`navbar-opp-apps-${user!.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "opportunity_applications",
          },
          () => {
            fetchPendingApplicationsCount();
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
  }, [user, roles, isProvider, supabase]);

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleMarkSingleRead = async (notifId: number) => {
    // Immediately dismiss the toast popup
    setActiveToast(null);
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notifId);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Filter out system auto-generated emails (e.g. +91XXXXXXXXXX@graphitex.app)
  const isRealEmail = user?.email && !user.email.endsWith("@graphitex.app");

  // Determine user location string from joined states and cities fetched by our hook
  const locationText = 
    (user as any)?.cities?.name && (user as any)?.states?.name
      ? `${(user as any).cities.name}, ${(user as any).states.name}`
      : null;

  // Render highly readable role text
  const primaryRole = (roles && roles.length > 0 && roles[0]) 
    ? (roles[0].provider_subtype 
        ? roles[0].provider_subtype.replace("_", " ") 
        : roles[0].role)
    : "customer";
  
  const roleLabel = primaryRole.replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className={styles.navWrapper}>
      {/* ── TOP CONTACT STRIP ── */}
      <div className={styles.topBar}>
        <div className={`container ${styles.topBarInner}`}>
          <div className={styles.topBarLeft}>
            <div className={styles.topBarItem}>
              <Phone size={11} />
              <span>+91 99999 99999</span>
            </div>
            <div className={styles.topBarDivider} />
            <div className={styles.topBarItem}>
              <MapPin size={11} />
              <span>Serving Mangalore</span>
            </div>
          </div>
          <div className={styles.topBarRight}>
            <span className={styles.topBarTag}>India&apos;s Creative Marketplace</span>
          </div>
        </div>
      </div>

      {/* ── MAIN NAV ── */}
      <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo} style={{ display: "inline-flex", alignItems: "center" }}>
            <Logo height={34} />
          </Link>
          
          <div className={styles.links}>
            <Link 
              href="/services" 
              className={`${styles.link} ${pathname.startsWith("/services") ? styles.active : ""}`}
            >
              Services
            </Link>
            {user && (
              <Link 
                href="/opportunities" 
                className={`${styles.link} ${pathname.startsWith("/opportunities") ? styles.active : ""}`}
              >
                Opportunities
              </Link>
            )}
            <Link 
              href="/influencers" 
              className={`${styles.link} ${pathname.startsWith("/influencers") ? styles.active : ""}`}
            >
              Influencers
            </Link>
          </div>
        </div>

        <div className={styles.right}>
          {/* List Your Business CTA */}
          {!user && (
            <Link href="/login" className={styles.listBtn}>
              <PlusCircle size={15} />
              <span>List Your Business</span>
            </Link>
          )}

          {loading ? (
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--color-border)", opacity: 0.5 }} />
          ) : user ? (
            <div className={styles.profileContainer} ref={dropdownRef}>
              <button 
                className={styles.avatarBtn} 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User Profile Options"
              >
                <div className={styles.avatarCircle}>
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={user.avatar_url} 
                      alt="User Avatar" 
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} 
                    />
                  ) : (
                    initials
                  )}
                  {displayCount > 0 && (
                    <span className={styles.avatarBadge}>{displayCount}</span>
                  )}
                </div>
              </button>

              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.headerAvatarCircle}>
                      {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={user.avatar_url} 
                          alt="User Avatar" 
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} 
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className={styles.headerInfo}>
                      <span className={styles.profileName}>{user.name}</span>
                      <span className={styles.roleBadge}>{roleLabel}</span>
                    </div>
                  </div>
                  
                  <div className={styles.dropdownDivider} />
                  
                  {/* Detailed User Metadata Details Section */}
                  <div className={styles.detailsSection}>
                    <div className={styles.detailRow}>
                      <Phone size={13} className={styles.detailIcon} />
                      <span className={styles.detailText}>{user.mobile_number}</span>
                    </div>
                    {isRealEmail && (
                      <div className={styles.detailRow}>
                        <Mail size={13} className={styles.detailIcon} />
                        <span className={styles.detailText}>{user.email}</span>
                      </div>
                    )}
                    {locationText && (
                      <div className={styles.detailRow}>
                        <MapPin size={13} className={styles.detailIcon} />
                        <span className={styles.detailText}>{locationText}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.dropdownDivider} />

                  {/* Interactive Notifications List Section */}
                  <div className={styles.notifHeaderRow}>
                    <span className={styles.notifTitle}>Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAllRead();
                        }} 
                        className={styles.markAllBtn}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  
                  <div className={styles.notifList}>
                    {notifications.filter(n => !n.is_read).length === 0 ? (
                      <div className={styles.emptyNotifs}>
                        No notifications yet ✨
                      </div>
                    ) : (
                      notifications.filter(n => !n.is_read).slice(0, 4).map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkSingleRead(notif.id);
                          }}
                          className={`${styles.notifItem} ${!notif.is_read ? styles.unreadItem : ""}`}
                        >
                          <div className={styles.notifDot} />
                          <div className={styles.notifContent}>
                            <div className={styles.notifTextTitle}>{notif.title}</div>
                            {notif.body && <div className={styles.notifBody}>{notif.body}</div>}
                            <div className={styles.notifTime}>
                              {new Date(notif.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className={styles.dropdownDivider} />
                  
                  <Link href="/dashboard/profile" className={styles.dropdownItem}>
                    <LayoutDashboard size={15} style={{ marginRight: "10px", opacity: 0.8 }} />
                    <span>Go to Dashboard</span>
                    <ChevronRight size={13} style={{ marginLeft: "auto", opacity: 0.4 }} />
                  </Link>
                  
                  <div className={styles.dropdownDivider} />
                  
                  <button 
                    onClick={handleLogout} 
                    className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                  >
                    <LogOut size={15} style={{ marginRight: "10px" }} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : !user ? (
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          ) : null}
        </div>

        {/* Mobile responsive right-aligned grouped controls */}
        <div className={`${styles.mobileControls} ${isDrawerOpen ? styles.mobileControlsHidden : ""}`}>
          {/* Hamburger Menu Toggle Button */}
          <button 
            className={styles.hamburgerBtn}
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isDrawerOpen}
          >
            {isDrawerOpen ? (
              <X size={22} />
            ) : (
              <>
                <Menu size={22} />
                {displayCount > 0 && <span className={styles.hamburgerBadge} />}
              </>
            )}
          </button>

          {/* If not logged in, show signin/login icon next to hamburger */}
          {!loading && !user && (
            <Link 
              href="/login" 
              className={styles.mobileActionCircle} 
              aria-label="Login"
            >
              <LogIn size={16} />
            </Link>
          )}
        </div>
      </div>

      {/* Floating Critical Toast Alert Modal Card */}
      {activeToast && (
        <div className={styles.toastContainer}>
          <div className={`${styles.toastCard} ${(activeToast.type.includes('reject') || activeToast.type === 'opportunity_removed' || activeToast.type === 'profile_suspended') ? styles.toastReject : styles.toastApprove}`}>
            <div className={styles.toastIconSection}>
              {activeToast.type.includes('reject') || activeToast.type === 'opportunity_removed' || activeToast.type === 'profile_suspended' ? (
                <XCircle size={24} className={styles.toastAlertIcon} />
              ) : (
                <CheckCircle2 size={24} className={styles.toastSuccessIcon} />
              )}
            </div>
            <div className={styles.toastBodySection}>
              <div className={styles.toastHeaderRow}>
                <h4 className={styles.toastTextTitle}>{activeToast.title}</h4>
                <button 
                  onClick={() => handleMarkSingleRead(activeToast.id)} 
                  className={styles.toastCloseBtn}
                  aria-label="Dismiss alert"
                >
                  ✕
                </button>
              </div>
              {activeToast.body && <p className={styles.toastTextBody}>{activeToast.body}</p>}
              {(activeToast.type === 'application_accepted' || activeToast.type === 'application_rejected') && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Link
                    href="/dashboard/applications"
                    onClick={() => handleMarkSingleRead(activeToast.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: 'var(--color-primary, hsl(262, 70%, 45%))',
                      color: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '11px',
                      fontWeight: 'var(--weight-bold)',
                      textDecoration: 'none',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'opacity 0.15s ease',
                      width: 'fit-content'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    📂 View My Applications
                  </Link>
                </div>
              )}
              <div className={styles.toastActionRow}>
                <button 
                  onClick={() => handleMarkSingleRead(activeToast.id)} 
                  className={styles.toastDismissBtn}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
 
    {/* ── STICKY SUB-HEADER ROW OF MENUS (MOBILE/TABLET) ── */}
    <div className={styles.subHeader}>
      <div className={`container ${styles.subHeaderInner}`}>
        <Link 
          href="/" 
          className={`${styles.subLink} ${pathname === "/" ? styles.subLinkActive : ""}`}
        >
          Home
        </Link>
        <div className={styles.subDivider} />
        <Link 
          href="/services" 
          className={`${styles.subLink} ${pathname.startsWith("/services") ? styles.subLinkActive : ""}`}
        >
          Services
        </Link>
        <div className={styles.subDivider} />
        {user && (
          <>
            <Link 
              href="/opportunities" 
              className={`${styles.subLink} ${pathname.startsWith("/opportunities") ? styles.subLinkActive : ""}`}
            >
              Opportunities
            </Link>
            <div className={styles.subDivider} />
          </>
        )}
        <Link 
          href="/influencers" 
          className={`${styles.subLink} ${pathname.startsWith("/influencers") ? styles.subLinkActive : ""}`}
        >
          Influencers
        </Link>
      </div>
    </div>

    {/* ── MOBILE SLIDING DRAWER & OVERLAY ── */}
    <div 
      className={`${styles.drawerOverlay} ${isDrawerOpen ? styles.drawerOverlayActive : ""}`} 
      onClick={() => setIsDrawerOpen(false)}
    />
    
    <div className={`${styles.mobileDrawer} ${isDrawerOpen ? styles.mobileDrawerOpen : ""}`}>
      <div className={styles.drawerHeader}>
        {/* Left: Close button first, then Logo */}
        <div className={styles.drawerHeaderLeft}>
          <button 
            className={styles.drawerCloseBtn}
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
          <Link href="/" className={styles.logo} onClick={() => setIsDrawerOpen(false)} style={{ display: "inline-flex", alignItems: "center" }}>
            <Logo height={24} />
          </Link>
        </div>

        {/* Right: Direct Profile/Login Icon */}
        <div className={styles.drawerHeaderRight}>
          {loading ? (
            <div className={styles.mobileLoaderCircle} style={{ width: "32px", height: "32px" }} />
          ) : user ? (
            <Link 
              href="/dashboard/profile" 
              className={styles.mobileActionCircle} 
              aria-label="Go to dashboard"
              onClick={() => setIsDrawerOpen(false)}
              style={{ width: "32px", height: "32px" }}
            >
              <User size={16} />
              {displayCount > 0 && (
                <span className={styles.mobileActionBadge} style={{ width: "14px", height: "14px", fontSize: "7px", top: "-2px", right: "-2px" }}>{displayCount}</span>
              )}
            </Link>
          ) : null}
        </div>
      </div>

      <div className={styles.drawerContent}>
        {/* Drawer Links */}
        <div className={styles.drawerLinks}>
          <Link 
            href="/services" 
            className={`${styles.drawerLink} ${pathname.startsWith("/services") ? styles.drawerLinkActive : ""}`}
            onClick={() => setIsDrawerOpen(false)}
          >
            Services
          </Link>
          {user && (
            <Link 
              href="/opportunities" 
              className={`${styles.drawerLink} ${pathname.startsWith("/opportunities") ? styles.drawerLinkActive : ""}`}
              onClick={() => setIsDrawerOpen(false)}
            >
              Opportunities
            </Link>
          )}
          <Link 
            href="/influencers" 
            className={`${styles.drawerLink} ${pathname.startsWith("/influencers") ? styles.drawerLinkActive : ""}`}
            onClick={() => setIsDrawerOpen(false)}
          >
            Influencers
          </Link>
        </div>

        {/* Profile Card if user is logged in */}
        {user ? (
          <>
            <div className={styles.drawerProfileCard}>
              <div className={styles.drawerProfileInfo}>
                <div className={styles.drawerAvatar}>
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={user.avatar_url} 
                      alt="User Avatar" 
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} 
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className={styles.drawerMeta}>
                  <span className={styles.drawerName}>{user.name}</span>
                  <span className={styles.drawerRole}>{roleLabel}</span>
                </div>
              </div>
              
              <div className={styles.drawerDetails}>
                <div className={styles.drawerDetailRow}>
                  <Phone size={12} className={styles.detailIcon} />
                  <span>{user.mobile_number}</span>
                </div>
                {isRealEmail && (
                  <div className={styles.drawerDetailRow}>
                    <Mail size={12} className={styles.detailIcon} />
                    <span style={{ wordBreak: 'break-all' }}>{user.email}</span>
                  </div>
                )}
                {locationText && (
                  <div className={styles.drawerDetailRow}>
                    <MapPin size={12} className={styles.detailIcon} />
                    <span>{locationText}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expandable/Scrollable Notifications Section in Drawer */}
            <div className={styles.drawerNotifSection}>
              <div className={styles.drawerNotifHeader}>
                <span className={styles.drawerNotifTitle}>Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAllRead();
                    }} 
                    className={styles.markAllBtn}
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className={styles.drawerNotifList}>
                {notifications.filter(n => !n.is_read).length === 0 ? (
                  <div className={styles.emptyNotifs} style={{ padding: 'var(--space-2) var(--space-4)' }}>
                    No notifications yet ✨
                  </div>
                ) : (
                  notifications.filter(n => !n.is_read).slice(0, 3).map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkSingleRead(notif.id);
                      }}
                      className={`${styles.drawerNotifItem} ${!notif.is_read ? styles.drawerNotifUnread : ""}`}
                    >
                      {!notif.is_read && <div className={styles.drawerNotifDot} />}
                      <div className={styles.drawerNotifContent}>
                        <div className={styles.drawerNotifText}>{notif.title}</div>
                        {notif.body && <div className={styles.drawerNotifBody}>{notif.body}</div>}
                        <div className={styles.drawerNotifTime}>
                          {new Date(notif.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Footer buttons inside drawer */}
      <div className={styles.drawerFooter}>
        {user ? (
          <>
            <Link 
              href="/dashboard/profile" 
              className={styles.drawerCtaBtn}
              onClick={() => setIsDrawerOpen(false)}
            >
              <LayoutDashboard size={14} />
              <span>Go to Dashboard</span>
            </Link>
            <button 
              onClick={() => {
                setIsDrawerOpen(false);
                handleLogout();
              }} 
              className={styles.drawerLogoutBtn}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link 
              href="/login" 
              className={styles.drawerCtaBtn}
              onClick={() => setIsDrawerOpen(false)}
            >
              <PlusCircle size={14} />
              <span>List Your Business</span>
            </Link>
            <Link 
              href="/login" 
              className={styles.drawerCtaBtn}
              style={{ background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary) !important' }}
              onClick={() => setIsDrawerOpen(false)}
            >
              <span>Login</span>
            </Link>
          </>
        )}
      </div>
    </div>
    </div>
  );
}
