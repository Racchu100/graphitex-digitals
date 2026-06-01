import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";
import ApplicationActions from "./ApplicationActions";
import { getInfluencerSlug } from "@/lib/utils/slug";

interface ApplicationsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApplicationsPage({ params }: ApplicationsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify the user owns this opportunity
  const { data: opp, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title, status, posted_by_user_id, business_profiles(whatsapp_number, contact_number)')
    .eq('id', id)
    .single();

  if (oppError || !opp) notFound();
  if (opp.posted_by_user_id !== user.id) redirect("/dashboard/opportunities");

  // Fetch applications with influencer profile details
  const { data: applications } = await supabase
    .from('opportunity_applications')
    .select(`
      *,
      influencer_profiles (
        id, user_id, display_name, profile_picture_url, contact_number,
        influencer_social_accounts (platform, follower_count)
      )
    `)
    .eq('opportunity_id', id)
    .order('created_at', { ascending: false });

  const formatNumber = (num: number) => {
    const n = Number(num || 0);
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + 'K';
    return n.toLocaleString("en-US");
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="/dashboard/opportunities" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
          ← Back to Opportunities
        </Link>
        <h1 style={{ marginTop: 'var(--space-3)' }}>{opp.title}</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {applications?.length || 0} application{applications?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {!applications || applications.length === 0 ? (
        <div className={styles.empty}>
          <h3>No Applications Yet</h3>
          <p>When influencers apply, they will appear here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {applications.map((app: any) => {
            const influencer = app.influencer_profiles;
            return (
              <div key={app.id} className={styles.card}>
                <div className={styles.cardLeft}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={influencer?.profile_picture_url || "/placeholder-avatar.png"}
                    alt={influencer?.display_name}
                    className={styles.avatar}
                  />
                  <div>
                    <h3 className={styles.name}>{influencer?.display_name}</h3>
                    <div className={styles.socials}>
                      {influencer?.influencer_social_accounts?.map((s: any) => (
                        <span key={s.platform} className={styles.socialChip}>
                          {s.platform === 'instagram' ? '📷' : s.platform === 'youtube' ? '🎥' : '📘'} {formatNumber(s.follower_count)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.cardMid}>
                  <div className={`${styles.statusBadge} ${styles[`status_${app.status}`]}`}>
                    {app.status}
                  </div>
                  {app.message && (
                    <p className={styles.message}>&ldquo;{app.message}&rdquo;</p>
                  )}
                  <p className={styles.date}>Applied {new Date(app.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
                </div>

                <div className={styles.cardRight}>
                  {(() => {
                    const slug = getInfluencerSlug(influencer?.display_name || "") || influencer?.id;
                    return (
                      <Link href={`/influencers/${slug}`} className={styles.actionBtn}>
                        View Profile
                      </Link>
                    );
                  })()}
                  <ApplicationActions
                    applicationId={app.id}
                    currentStatus={app.status}
                    opportunityId={id}
                    influencerProfileId={influencer?.id}
                    influencerUserId={influencer?.user_id}
                    opportunityTitle={opp.title}
                    businessWhatsapp={(opp as any)?.business_profiles?.whatsapp_number || (opp as any)?.business_profiles?.contact_number || ""}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
