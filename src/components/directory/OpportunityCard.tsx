import React from "react";
import Link from "next/link";
import styles from "./OpportunityCard.module.css";
import { Opportunity, BusinessProfile } from "@/types/database";
import { useUser } from "@/hooks/useUser";

interface OpportunityCardProps {
  opportunity: Opportunity & {
    business_profiles?: BusinessProfile & {
       business_media?: { url: string }[]
    };
  };
  isProvider?: boolean;
  hasApplied?: boolean;
}

export default function OpportunityCard({ opportunity, isProvider, hasApplied = false }: OpportunityCardProps) {
  const { roles } = useUser();
  const hasInfluencerRole = Array.isArray(roles) && roles.some(r => r?.role === 'influencer');
  const showApplyNow = hasInfluencerRole;

  const business = opportunity.business_profiles;
  const logoUrl = business?.business_media?.[0]?.url || "/placeholder-service.jpg";

  // Calculate expiry days
  const expires = new Date(opportunity.expires_at).getTime();
  const now = new Date().getTime();
  const daysLeft = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60 * 24)));
  
  const formattedMin = new Intl.NumberFormat('en-IN').format(opportunity.price_min);
  const formattedMax = new Intl.NumberFormat('en-IN').format(opportunity.price_max);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="Brand logo" className={styles.logo} />
          <div className={styles.brandInfo}>
             <span className={styles.brandName}>{business?.business_name || 'Unknown Business'}</span>
             <h3 className={styles.title}>{opportunity.title}</h3>
          </div>
        </div>
        <div className={`${styles.expiry} ${daysLeft < 3 ? styles.urgent : ''}`}>
           ⏱ {daysLeft} days left
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.purpose}>{opportunity.purpose}</p>
        
        <div className={styles.stats}>
           <div className={styles.statItem}>
              <span className={styles.statLabel}>Pay</span>
              <span className={styles.statValue}>{opportunity.currency} {formattedMin} – {formattedMax}</span>
           </div>
           <div className={styles.statItem}>
              <span className={styles.statLabel}>Followers</span>
              <span className={styles.statValue}>{opportunity.min_followers >= 1000 ? (opportunity.min_followers / 1000) + 'K+' : opportunity.min_followers + '+'}</span>
           </div>
           <div className={styles.statItem}>
              <span className={styles.statLabel}>Platform</span>
              <span className={styles.statValue} style={{ textTransform: 'capitalize' }}>{opportunity.platform_preference}</span>
           </div>
        </div>
      </div>

      <div className={styles.footer}>
         {isProvider ? (
            <Link href={`/dashboard/opportunities/${opportunity.id}/applications`} className={styles.btnSecondary}>
               View Applications
            </Link>
         ) : (
            <>
                {showApplyNow && (
                   hasApplied ? (
                      <Link href="/dashboard/applications" className={styles.btnApplied}>
                         Applied
                      </Link>
                   ) : (
                      <Link href={`/opportunities/${opportunity.id}`} className={styles.btnPrimary}>
                         Apply Now
                      </Link>
                   )
                )}
               <Link href={`/opportunities/${opportunity.id}`} className={styles.btnSecondary}>
                 View Details
               </Link>
            </>
         )}
      </div>
    </div>
  );
}
