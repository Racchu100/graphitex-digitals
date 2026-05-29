import React from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";
import ApplySection from "./ApplySection";

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: OpportunityDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: opp, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      business_profiles (
        id, business_name, tagline, website_url,
        categories(name),
        cities(name),
        business_media(url, media_type)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !opp) notFound();

  // Check if current user is an influencer and has a published profile
  let influencerProfile: any = null;
  let existingApplication: any = null;
  let userRole: string | null = null;

  if (user) {
    // A. Fetch roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
      
    if (roles && roles.length > 0) {
      const hasInfluencer = Array.isArray(roles) && roles.some(r => r?.role === 'influencer');
      const hasProvider = Array.isArray(roles) && roles.some(r => r?.role === 'provider');
      userRole = hasInfluencer ? 'influencer' : hasProvider ? 'provider' : roles[0].role;
    }

    // B. Fetch influencer profile
    const { data: ip } = await supabase
      .from('influencer_profiles')
      .select('id, status, display_name')
      .eq('user_id', user.id)
      .eq('status', 'published')
      .maybeSingle();

    if (ip) {
      influencerProfile = ip;

      const { data: app } = await supabase
        .from('opportunity_applications')
        .select('id, status')
        .eq('opportunity_id', id)
        .eq('influencer_profile_id', ip.id)
        .maybeSingle();

      existingApplication = app;
    }
  }

  const business = opp.business_profiles as any;
  const daysLeft = Math.max(0, Math.ceil((new Date(opp.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const formattedMin = new Intl.NumberFormat('en-IN', { style: 'currency', currency: opp.currency }).format(opp.price_min);
  const formattedMax = new Intl.NumberFormat('en-IN', { style: 'currency', currency: opp.currency }).format(opp.price_max);

  return (
    <div className={`container ${styles.page}`}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/opportunities">Opportunities</Link>
        <span>›</span>
        <span>{opp.title}</span>
      </div>

      <div className={styles.layout}>
        {/* Main Content */}
        <main className={styles.main}>
          <div className={styles.card}>
            <div className={styles.topBar}>
              <div>
                <p className={styles.postedBy}>Posted by <strong>{business?.business_name}</strong></p>
                <h1 className={styles.title}>{opp.title}</h1>
                <p className={styles.purpose}>{opp.purpose}</p>
              </div>
              <div className={`${styles.expiryBadge} ${daysLeft < 3 ? styles.urgent : ''}`}>
                ⏱ {daysLeft} days left
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Pay Range</span>
                <span className={styles.statValue}>{formattedMin} – {formattedMax}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Min Followers</span>
                <span className={styles.statValue}>{opp.min_followers >= 1000 ? (opp.min_followers / 1000) + 'K+' : opp.min_followers + '+'}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Platform</span>
                <span className={`${styles.statValue} ${styles.capitalize}`}>{opp.platform_preference}</span>
              </div>
            </div>

            <div className={styles.section}>
              <h2>About this Opportunity</h2>
              <div className={styles.description}>{opp.description}</div>
            </div>

            <div className={styles.section}>
              <h2>Timeline</h2>
              <div className={styles.timeline}>
                <div>
                  <span className={styles.statLabel}>Starts</span>
                  <span className={styles.statValue}>{new Date(opp.starts_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                </div>
                <div>
                  <span className={styles.statLabel}>Expires</span>
                  <span className={styles.statValue}>{new Date(opp.expires_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Business Card */}
          {business && (
            <div className={styles.businessCard}>
              <h3>About the Brand</h3>
              <p className={styles.businessName}>{business.business_name}</p>
              {business.tagline && <p className={styles.businessTagline}>{business.tagline}</p>}
              {business.categories && <span className={styles.badge}>{business.categories.name}</span>}
              {business.website_url && (
                <a href={business.website_url} target="_blank" rel="noreferrer" className={styles.websiteLink}>
                  Visit Website ↗
                </a>
              )}
            </div>
          )}

          {/* Apply CTA */}
          <ApplySection
            opportunityId={opp.id}
            opportunityTitle={opp.title}
            opportunityStatus={opp.status}
            influencerProfile={influencerProfile}
            existingApplication={existingApplication}
            isLoggedIn={!!user}
            userRole={userRole}
          />
        </aside>
      </div>
    </div>
  );
}
