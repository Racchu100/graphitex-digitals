"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./NavBar.module.css";
import Button from "@/components/ui/Button";
import { useUser } from "@/hooks/useUser";
import Logo from "@/components/layout/Logo";
import { createClient } from "@/lib/supabase/client";
import { Mail, Phone, MapPin, LogOut, LayoutDashboard, ChevronRight, CheckCircle2, XCircle, PlusCircle, Menu, X, User, LogIn, Share2, Copy, Check } from "lucide-react";
import { getInfluencerSlug } from "@/lib/utils/slug";

interface SocialIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const InstagramIcon = ({ size = 24, ...props }: SocialIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 24, ...props }: SocialIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

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
  const [showGalleryAlert, setShowGalleryAlert] = useState(false);

  // Share profile state & hooks
  const [profileUrlPath, setProfileUrlPath] = useState("");
  const [profileShareData, setProfileShareData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [instaHelperActive, setInstaHelperActive] = useState(false);
  const [isMobileShareSupported, setIsMobileShareSupported] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        setIsMobileShareSupported(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!user || !roles || roles.length === 0) {
      setProfileUrlPath("");
      setProfileShareData(null);
      return;
    }

    const userId = user.id;
    const userAvatarUrl = user.avatar_url;

    async function fetchProfileForSharing() {
      try {
        const isProviderUser = roles.some(r => r?.role === 'provider');
        const isInfluencerUser = roles.some(r => r?.role === 'influencer');

        if (isProviderUser) {
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('id, business_name, tagline, profile_picture_url, status')
            .eq('user_id', userId)
            .maybeSingle();

          if (profile) {
            const slug = getInfluencerSlug(profile.business_name) || profile.id;
            setProfileUrlPath(`/services/${slug}`);
            setProfileShareData({
              name: profile.business_name,
              avatar_url: profile.profile_picture_url || userAvatarUrl || "/placeholder-service.jpg",
              type: 'Provider',
              roleLabel: 'Service Provider',
              metaText: profile.tagline || ''
            });
          }
        } else if (isInfluencerUser) {
          const { data: profile } = await supabase
            .from('influencer_profiles')
            .select('id, display_name, profile_picture_url, status')
            .eq('user_id', userId)
            .maybeSingle();

          if (profile) {
            const { data: socials } = await supabase
              .from('influencer_social_accounts')
              .select('follower_count')
              .eq('influencer_profile_id', profile.id);

            const totalFollowers = socials ? socials.reduce((sum: number, s: any) => sum + Number(s.follower_count || 0), 0) : 0;
            const slug = getInfluencerSlug(profile.display_name) || profile.id;
            setProfileUrlPath(`/influencers/${slug}`);
            setProfileShareData({
              name: profile.display_name,
              avatar_url: profile.profile_picture_url || userAvatarUrl || "/placeholder-avatar.svg",
              type: 'Influencer',
              roleLabel: 'Influencer',
              metaText: totalFollowers > 0 ? `${totalFollowers.toLocaleString("en-US")} Followers` : ''
            });
          }
        }
      } catch (err) {
        console.warn("Failed to fetch sharing profile:", err);
      }
    }

    fetchProfileForSharing();
  }, [user, roles, supabase]);

  const handleShareProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDrawerOpen(false);
    setDropdownOpen(false);
    if (typeof window !== "undefined" && profileUrlPath && profileShareData) {
      setCurrentUrl(window.location.origin + profileUrlPath);
      setProfileData(profileShareData);
      setShowShareModal(true);
    }
  };

  const handleShareWebsite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDrawerOpen(false);
    setDropdownOpen(false);
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.origin);
      setProfileData({
        name: "Graphitex Digitals",
        avatar_url: "/logo.png",
        roleLabel: "Creative Marketplace",
        metaText: "Mangalore, India"
      });
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    const urlToCopy = profileData?.name === "Graphitex Digitals" ? "https://www.graphitexdigitals.com/" : currentUrl;
    if (typeof navigator !== "undefined" && urlToCopy) {
      navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInstagramShare = () => {
    const urlToCopy = profileData?.name === "Graphitex Digitals" ? "https://www.graphitexdigitals.com/" : currentUrl;
    if (typeof navigator !== "undefined" && urlToCopy) {
      navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setInstaHelperActive(true);
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setInstaHelperActive(false), 5000);
    }
  };

  const handleNativeShare = async () => {
    const urlToShare = profileData?.name === "Graphitex Digitals" ? "https://www.graphitexdigitals.com/" : currentUrl;
    if (typeof navigator !== "undefined" && (navigator as any).share && urlToShare) {
      try {
        await (navigator as any).share({
          title: `${profileData?.name || "Graphitex"}`,
          text: profileData?.name === "Graphitex Digitals"
            ? `🚀 Grow with Graphitex Digitals!\n\nFor Customers:\n✔ Find trusted local businesses through our business directory based on your needs.\n\nFor Business Owners:\n✔ Connect and collaborate with influencers\n✔ Website Development\n✔ Graphic Design\n✔ Instagram Page Management\n✔ Digital Marketing\n✔ Ad & Promotional Shoots\n\nEverything you need to grow your business, increase visibility, attract more customers, and build a strong online presence—all in one place.\n\nCheck out Graphitex Digitals today!`
            : `Check out ${profileData?.name || "this link"} on Graphitex Digitals!`,
          url: urlToShare,
        });
      } catch (err) {
        console.warn("Error native sharing:", err);
      }
    }
  };

  const shareText = profileData 
    ? (profileData.name === "Graphitex Digitals"
        ? `🚀 Grow with Graphitex Digitals!\n\nFor Customers:\n✔ Find trusted local businesses through our business directory based on your needs.\n\nFor Business Owners:\n✔ Connect and collaborate with influencers\n✔ Website Development\n✔ Graphic Design\n✔ Instagram Page Management\n✔ Digital Marketing\n✔ Ad & Promotional Shoots\n\nEverything you need to grow your business, increase visibility, attract more customers, and build a strong online presence—all in one place.\n\nCheck out Graphitex Digitals today!\nhttps://www.graphitexdigitals.com/`
        : `Check out ${profileData.name} on Graphitex Digitals!`)
    : "Check out my profile on Graphitex Digitals!";

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    profileData?.name === "Graphitex Digitals" ? shareText : `${shareText} ${currentUrl}`
  )}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    profileData?.name === "Graphitex Digitals" ? "https://www.graphitexdigitals.com/" : currentUrl
  )}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    profileData?.name === "Graphitex Digitals" ? shareText : shareText
  )}${profileData?.name === "Graphitex Digitals" ? "" : `&url=${encodeURIComponent(currentUrl)}`}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    profileData?.name === "Graphitex Digitals" ? "https://www.graphitexdigitals.com/" : currentUrl
  )}`;



  const isProvider = Array.isArray(roles) && roles.some(r => r?.role === 'provider');
  const displayCount = isProvider ? (unreadCount + pendingApplicationsCount) : unreadCount;

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
        
        let fetchedNotifs = data || [];

        // Check if user has an approved business profile to inject the collaboration suggestion (Only for Local Businesses / Providers)
        const isProviderUser = roles?.some(r => r?.role === 'provider');
        const isInfluencerUser = roles?.some(r => r?.role === 'influencer');
        let isApproved = false;
        let hasOpportunities = false;

        if (isProviderUser) {
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('status')
            .eq('user_id', user!.id)
            .maybeSingle();
          if (profile && profile.status === 'approved') {
            isApproved = true;

            // Check if provider has posted at least one opportunity
            const { count, error: oppsError } = await supabase
              .from('opportunities')
              .select('id', { count: 'exact', head: true })
              .eq('posted_by_user_id', user!.id);
            if (!oppsError && count !== null && count > 0) {
              hasOpportunities = true;
            }
          }
        }

        // Check if profile basic details are filled (Display Name & Bio / Description)
        let isProfileIncomplete = false;
        let incompleteFields: string[] = [];

        const hasNoRoles = !roles || roles.length === 0;
        const isMissingOnboarding = !user?.name?.trim() || !user?.state_id || !user?.city_id;

        if (hasNoRoles || isMissingOnboarding) {
          isProfileIncomplete = true;
          if (!user?.name?.trim()) incompleteFields.push("Full Name");
          if (!user?.state_id) incompleteFields.push("State");
          if (!user?.city_id) incompleteFields.push("City");
          if (hasNoRoles) incompleteFields.push("Role");
        } else if (isInfluencerUser) {
          const { data: infProfile } = await supabase
            .from('influencer_profiles')
            .select('display_name, bio')
            .eq('user_id', user!.id)
            .maybeSingle();

          let hasBio = false;
          if (infProfile?.bio) {
            try {
              if (infProfile.bio.trim().startsWith("{")) {
                const parsed = JSON.parse(infProfile.bio);
                if (parsed?.bio?.trim()) {
                  hasBio = true;
                }
              } else if (infProfile.bio.trim()) {
                hasBio = true;
              }
            } catch (e) {}
          }

          if (!infProfile || !infProfile.display_name?.trim() || !hasBio) {
            isProfileIncomplete = true;
            if (!infProfile?.display_name?.trim()) incompleteFields.push("Display Name");
            if (!hasBio) incompleteFields.push("Bio");
          }
        } else if (isProviderUser) {
          const { data: bizProfile } = await supabase
            .from('business_profiles')
            .select('business_name, description')
            .eq('user_id', user!.id)
            .maybeSingle();

          if (!bizProfile || !bizProfile.business_name?.trim() || !bizProfile.description?.trim()) {
            isProfileIncomplete = true;
            if (!bizProfile?.business_name?.trim()) incompleteFields.push("Business Name");
            if (!bizProfile?.description?.trim()) incompleteFields.push("Description");
          }
        }

        const isDismissed = sessionStorage.getItem("collab_alert_dismissed");
        if (isApproved && !hasOpportunities && isDismissed !== "true") {
          const collabVirtualNotif = {
            id: "virtual-collab-alert",
            title: "🚀 Find Creative Creators!",
            body: "Your profile is approved! Click to post campaigns and collaborate with influencers.",
            created_at: new Date().toISOString(),
            is_read: false,
            type: "collab_suggestion"
          };
          fetchedNotifs = [collabVirtualNotif, ...fetchedNotifs];
        }

        const isIncompleteDismissed = sessionStorage.getItem("incomplete_profile_alert_dismissed");
        const isProfilePage = pathname?.startsWith("/dashboard/profile") || pathname?.startsWith("/onboarding");
        if (isProfileIncomplete && isIncompleteDismissed !== "true" && !isProfilePage) {
          const incompleteVirtualNotif = {
            id: "virtual-incomplete-profile-alert",
            title: "📝 Complete Your Profile!",
            body: `Your basic info (${incompleteFields.join(", ")}) is not filled. Click here to complete your profile.`,
            created_at: new Date().toISOString(),
            is_read: false,
            type: "profile_incomplete"
          };
          fetchedNotifs = [incompleteVirtualNotif, ...fetchedNotifs];
        }

        const isOppSuggestionDismissed = sessionStorage.getItem("opp_suggestion_alert_dismissed");
        const isOppPage = pathname?.startsWith("/opportunities");
        if (isInfluencerUser && !isProfileIncomplete && isOppSuggestionDismissed !== "true" && !isOppPage) {
          const oppVirtualNotif = {
            id: "virtual-opp-suggestion-alert",
            title: "📣 View active opportunities posted by business owners!",
            body: "Find collaboration campaigns that fit your profile, review payouts, and apply directly to work with local brands.",
            created_at: new Date().toISOString(),
            is_read: false,
            type: "opp_suggestion"
          };
          fetchedNotifs = [oppVirtualNotif, ...fetchedNotifs];
        }

        setNotifications(fetchedNotifs);
        
        const unread = fetchedNotifs.filter((n: any) => !n.is_read) || [];
        setUnreadCount(unread.length);

        // Find if there is any unread approved/rejected critical notification
        const criticalNotif = unread.find((n: any) => 
          n.type === "profile_approved" || 
          n.type === "profile_rejected" || 
          n.type === "profile_suspended" || 
          n.type === "profile_reactivated" || 
          n.type === "application_accepted" || 
          n.type === "application_rejected" || 
          n.type === "opportunity_removed" ||
          n.type === "collab_suggestion" ||
          n.type === "profile_incomplete"
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
  }, [user, roles, isProvider, supabase, pathname]);

  useEffect(() => {
    if (!user) {
      setShowGalleryAlert(false);
      return;
    }

    // Do not show the gallery media alert on profile settings or onboarding pages
    if (pathname.startsWith('/dashboard/profile') || pathname.startsWith('/onboarding')) {
      setShowGalleryAlert(false);
      return;
    }

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem("gallery_alert_dismissed");
    if (isDismissed === "true") return;

    async function checkGalleryMedia() {
      try {
        const isProviderUser = roles?.some(r => r?.role === 'provider');
        const isInfluencerUser = roles?.some(r => r?.role === 'influencer');

        if (isProviderUser) {
          // Fetch business profile
          const { data: profile } = await supabase
            .from('business_profiles')
            .select('id')
            .eq('user_id', user!.id)
            .maybeSingle();

          if (profile) {
            // Count media items (excluding the thumbnail at sort_order 0 or first image)
            const { data: mediaItems } = await supabase
              .from('business_media')
              .select('id')
              .eq('business_profile_id', profile.id);

            // If there's 1 or less image (e.g. only the thumbnail is present, but no gallery items), show alert!
            if (!mediaItems || mediaItems.length <= 1) {
              setShowGalleryAlert(true);
            }
          }
        } else if (isInfluencerUser) {
          // Fetch influencer profile (including bio where media showcase list is saved as JSON)
          const { data: profile } = await supabase
            .from('influencer_profiles')
            .select('id, bio')
            .eq('user_id', user!.id)
            .maybeSingle();

          if (profile) {
            let hasMedia = false;
            try {
              if (profile.bio && profile.bio.trim().startsWith('{')) {
                const parsed = JSON.parse(profile.bio);
                if (parsed && Array.isArray(parsed.media) && parsed.media.length > 0) {
                  hasMedia = true;
                }
              }
            } catch (e) {
              console.warn("Failed to parse influencer bio media:", e);
            }

            if (!hasMedia) {
              setShowGalleryAlert(true);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to check gallery media:", err);
      }
    }

    // Wait until roles are loaded to check
    if (!loading && roles && roles.length > 0) {
      checkGalleryMedia();
    }
  }, [user, roles, loading, supabase, pathname]);



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

  const handleMarkSingleRead = async (notifId: number | string, skipRedirect: boolean = false) => {
    // Immediately dismiss the toast popup
    setActiveToast(null);

    if (notifId === "virtual-collab-alert") {
      sessionStorage.setItem("collab_alert_dismissed", "true");
      setNotifications(prev => prev.filter(n => n.id !== "virtual-collab-alert"));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setDropdownOpen(false);
      setIsDrawerOpen(false);
      if (!skipRedirect) {
        router.push("/dashboard/opportunities");
      }
      return;
    }

    if (notifId === "virtual-incomplete-profile-alert") {
      sessionStorage.setItem("incomplete_profile_alert_dismissed", "true");
      setNotifications(prev => prev.filter(n => n.id !== "virtual-incomplete-profile-alert"));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setDropdownOpen(false);
      setIsDrawerOpen(false);
      if (!skipRedirect) {
        const targetPath = (!roles || roles.length === 0 || !user?.state_id || !user?.city_id) ? "/onboarding" : "/dashboard/profile";
        router.push(targetPath);
      }
      return;
    }

    if (notifId === "virtual-opp-suggestion-alert") {
      sessionStorage.setItem("opp_suggestion_alert_dismissed", "true");
      setNotifications(prev => prev.filter(n => n.id !== "virtual-opp-suggestion-alert"));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setDropdownOpen(false);
      setIsDrawerOpen(false);
      if (!skipRedirect) {
        router.push("/opportunities");
      }
      return;
    }

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notifId as number);

      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("do you want to log out");
    if (!confirmLogout) return;

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Failed to log out from server cleanly:", err);
    } finally {
      // Defensively clear local and session cache storage
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("graphitex_cached_user");
          window.sessionStorage.clear();
        }
      } catch (e) {}
      router.push("/");
      router.refresh();
    }
  };

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Filter out system auto-generated emails (e.g. +91XXXXXXXXXX@graphitex.app)
  const isRealEmail = user?.email && !user.email.toLowerCase().endsWith("@graphitex.app");

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
                      <div className={styles.nameShareWrapper}>
                        <span className={styles.profileName}>{user.name}</span>
                        {profileUrlPath && (
                          <button 
                            className={styles.profileShareBtn} 
                            onClick={handleShareProfile}
                            title="Share Profile"
                          >
                            <Share2 size={13} />
                          </button>
                        )}
                      </div>
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
                    <span className={styles.notifTitle}>
                      Notifications <span className={styles.redCount}>({unreadCount})</span>
                    </span>
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
                  <div className={styles.dropdownDivider} />
                  <button 
                    onClick={handleShareWebsite} 
                    className={styles.dropdownItem}
                  >
                    <Share2 size={15} style={{ marginRight: "10px", color: "var(--color-primary)" }} />
                    <span>Share Graphitex Digitals</span>
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
                {displayCount > 0 && (
                  <span className={styles.hamburgerBadge}>{displayCount}</span>
                )}
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
          <div 
            className={`${styles.toastCard} ${(activeToast.type.includes('reject') || activeToast.type === 'opportunity_removed' || activeToast.type === 'profile_suspended') ? styles.toastReject : styles.toastApprove}`}
            onClick={(e) => {
              if (activeToast.type === 'collab_suggestion') {
                const target = e.target as HTMLElement;
                if (
                  target.closest(`.${styles.toastCloseBtn}`) || 
                  target.closest(`.${styles.toastDismissBtn}`) ||
                  target.closest('a')
                ) {
                  return;
                }
                handleMarkSingleRead(activeToast.id, true);
                router.push("/dashboard/opportunities");
              }
            }}
            style={activeToast.type === 'collab_suggestion' ? { cursor: 'pointer' } : undefined}
          >
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
                  onClick={() => handleMarkSingleRead(activeToast.id, true)} 
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
                    onClick={() => handleMarkSingleRead(activeToast.id, true)}
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
              {activeToast.type === 'collab_suggestion' && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Link
                    href="/dashboard/opportunities"
                    onClick={() => handleMarkSingleRead(activeToast.id, true)}
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
                    🚀 Post a Campaign
                  </Link>
                </div>
              )}
              {activeToast.type === 'profile_incomplete' && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Link
                    href={(!roles || roles.length === 0 || !user?.state_id || !user?.city_id) ? "/onboarding" : "/dashboard/profile"}
                    onClick={() => handleMarkSingleRead(activeToast.id, true)}
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
                    📝 Fill Profile Info
                  </Link>
                </div>
              )}
              <div className={styles.toastActionRow}>
                <button 
                  onClick={() => handleMarkSingleRead(activeToast.id, true)} 
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
                  <div className={styles.drawerNameShareWrapper}>
                    <span className={styles.drawerName}>{user.name}</span>
                    {profileUrlPath && (
                      <button 
                        className={styles.profileShareBtn} 
                        onClick={handleShareProfile}
                        title="Share Profile"
                      >
                        <Share2 size={13} />
                      </button>
                    )}
                  </div>
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
                <span className={styles.drawerNotifTitle}>
                  Notifications <span className={styles.redCount}>({unreadCount})</span>
                </span>
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
        
        <button 
          onClick={handleShareWebsite} 
          className={styles.drawerShareBtn}
        >
          <Share2 size={14} />
          <span>Share Graphitex Digitals</span>
        </button>
      </div>
    </div>
      {/* Share Profile Modal */}
      {showShareModal && (
        <div className={styles.modalOverlay} onClick={() => setShowShareModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Share Profile</h3>
              <button className={styles.modalClose} onClick={() => setShowShareModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Mini Profile Card */}
            {profileData && (
              <div className={styles.shareProfileMiniCard}>
                <div className={styles.shareProfileMiniAvatarContainer}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={profileData.avatar_url}
                    alt={profileData.name}
                    className={styles.shareProfileMiniAvatar}
                  />
                </div>
                <div className={styles.shareProfileMiniInfo}>
                  <h4 className={styles.shareProfileMiniName}>{profileData.name}</h4>
                  <div className={styles.shareProfileMiniMeta}>
                    <span>{profileData.roleLabel}</span>
                    {profileData.metaText && <span>• {profileData.metaText}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Share Grid */}
            <div className={styles.shareOptionsGrid}>
              {/* WhatsApp */}
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.shareOptionItem}>
                <div className={`${styles.shareIconCircle} ${styles.shareIconWhatsapp}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.63 1.97 14.155.945 11.533.945c-5.445 0-9.87 4.373-9.874 9.802-.002 2.03.535 4.022 1.558 5.769l-.99 3.613 3.738-.975zM17.476 14.39c-.326-.162-1.93-.941-2.228-1.05-.297-.108-.513-.162-.73.162-.216.324-.838 1.05-1.027 1.267-.19.216-.379.243-.705.082-.326-.162-1.378-.504-2.625-1.608-.971-.859-1.626-1.92-1.816-2.244-.19-.324-.02-.5-.18-.661-.147-.145-.326-.379-.489-.569-.163-.19-.217-.324-.326-.541-.108-.216-.054-.405-.027-.568.027-.162.216-.513.326-.757.108-.243.162-.405.243-.567.081-.162.04-.324-.013-.486-.054-.162-.513-1.217-.703-1.67-.185-.443-.37-.383-.513-.39-.13-.006-.282-.008-.431-.008-.149 0-.39.054-.595.27-.205.216-.784.757-.784 1.84 0 1.08.795 2.124.903 2.27.108.147 1.564 2.358 3.79 3.298.53.223.943.356 1.265.457.532.167 1.017.143 1.399.088.427-.062 1.93-.778 2.2-1.49.27-.711.27-1.32.19-1.446-.081-.127-.297-.205-.623-.368z"/>
                  </svg>
                </div>
                <span className={styles.shareOptionText}>WhatsApp</span>
              </a>

              {/* Instagram Story / Reels */}
              <div onClick={handleInstagramShare} className={styles.shareOptionItem}>
                <div className={`${styles.shareIconCircle} ${styles.shareIconInstagram}`}>
                  <InstagramIcon size={20} />
                </div>
                <span className={styles.shareOptionText}>Insta / Reels</span>
              </div>

              {/* Facebook */}
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className={styles.shareOptionItem}>
                <div className={`${styles.shareIconCircle} ${styles.shareIconFacebook}`}>
                  <FacebookIcon size={20} />
                </div>
                <span className={styles.shareOptionText}>Facebook</span>
              </a>

              {/* Twitter / X */}
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className={styles.shareOptionItem}>
                <div className={`${styles.shareIconCircle} ${styles.shareIconTwitter}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className={styles.shareOptionText}>Twitter / X</span>
              </a>

              {/* LinkedIn */}
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className={styles.shareOptionItem}>
                <div className={`${styles.shareIconCircle} ${styles.shareIconLinkedIn}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </div>
                <span className={styles.shareOptionText}>LinkedIn</span>
              </a>
            </div>

            {/* Link Copy Box */}
            <div className={styles.shareLinkBox}>
              <input
                type="text"
                readOnly
                value={profileData?.name === "Graphitex Digitals" ? "https://www.graphitexdigitals.com/" : currentUrl}
                className={styles.shareLinkInput}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button className={styles.shareLinkCopyBtn} onClick={handleCopyLink}>
                {copied ? <Check size={16} className={styles.copyCheckIcon} /> : <Copy size={16} />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>

            {/* Custom Helper Message */}
            {instaHelperActive && (
              <div className={styles.shareToast}>
                ✓ Link copied! You can now paste it into your Instagram stories, bio, feed posts, or reels descriptions.
              </div>
            )}

            {/* Mobile Native Share Trigger */}
            {isMobileShareSupported && (
              <button className={styles.nativeShareBtn} onClick={handleNativeShare}>
                <Share2 size={16} />
                <span>More Share Options</span>
              </button>
            )}
          </div>
        </div>
      )}

      {showGalleryAlert && (

        <div className={styles.galleryAlertContainer}>
          <div className={styles.galleryAlertCard}>
            <button 
              className={styles.galleryAlertCloseBtn}
              onClick={() => {
                sessionStorage.setItem("gallery_alert_dismissed", "true");
                setShowGalleryAlert(false);
              }}
              aria-label="Dismiss alert"
            >
              ✕
            </button>
            <h4 className={styles.galleryAlertTitle}>
              📸 Add Gallery Media
            </h4>
            <p className={styles.galleryAlertBody}>
              Your profile is active, but you haven&apos;t uploaded any showcase photos or videos to your media gallery yet. Add some media to attract more customers!
            </p>
            <Link 
              href="/dashboard/profile"
              onClick={() => {
                sessionStorage.setItem("gallery_alert_dismissed", "true");
                setShowGalleryAlert(false);
              }}
            >
              <Button size="sm" className={styles.galleryAlertActionBtn} fullWidth>
                Go to Profile Settings
              </Button>
            </Link>
          </div>
        </div>
      )}


    </div>
  );
}
