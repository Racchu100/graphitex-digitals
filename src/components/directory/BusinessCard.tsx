import React from "react";
import Link from "next/link";
import styles from "./BusinessCard.module.css";
import { BusinessProfile } from "@/types/database";
import { getInfluencerSlug } from "@/lib/utils/slug";

interface BusinessCardProps {
  profile: BusinessProfile & {
    categories?: { name: string } | null;
    cities?: { name: string } | null;
    states?: { name: string } | null;
    business_media?: { url: string; media_type: string; sort_order?: number }[];
  };
}

export default function BusinessCard({ profile }: BusinessCardProps) {
  const sortedMedia = profile.business_media
    ? [...profile.business_media].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];
  const primaryImage = sortedMedia.find(m => m.media_type === "image")?.url || "/placeholder-service.jpg";
  const businessSlug = getInfluencerSlug(profile.business_name) || profile.id;
  
  return (
    <div className={styles.card}>
      <Link href={`/services/${businessSlug}`} className={styles.imageLink}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={primaryImage} 
          alt={profile.business_name} 
          className={styles.image}
          loading="lazy"
        />
      </Link>
      
      <div className={styles.content}>
        <div className={styles.header}>
           <Link href={`/services/${businessSlug}`} className={styles.titleLink}>
              <h3 className={styles.title}>{profile.business_name}</h3>
           </Link>
            <div className={styles.meta}>
               {profile.categories && <span className={styles.badge}>{profile.categories.name}</span>}
               {(profile.cities || profile.address_line) && (
                 <span className={styles.location} title={[profile.address_line, profile.cities?.name, profile.states?.name].filter(Boolean).join(", ")}>
                   📍 {profile.address_line 
                      ? [profile.address_line, profile.cities?.name, profile.states?.name].filter(Boolean).join(", ")
                      : [profile.cities?.name, profile.states?.name].filter(Boolean).join(", ")}
                 </span>
               )}
            </div>
        </div>
        
        {profile.tagline && (
          <p className={styles.tagline}>{profile.tagline}</p>
        )}
        
        <div className={styles.actions}>
           {profile.contact_type === 'whatsapp' && profile.whatsapp_number ? (
             <a 
               href={`https://wa.me/${profile.whatsapp_number}`} 
               target="_blank" 
               rel="noreferrer"
               className={`${styles.button} ${styles.primary}`}
             >
               WhatsApp
             </a>
           ) : (
             <a 
               href={`tel:${profile.contact_number}`} 
               className={`${styles.button} ${styles.primary}`}
             >
               Call Now
             </a>
           )}
           <Link href={`/services/${businessSlug}`} className={`${styles.button} ${styles.secondary}`}>
             View
           </Link>
        </div>
      </div>
    </div>
  );
}
