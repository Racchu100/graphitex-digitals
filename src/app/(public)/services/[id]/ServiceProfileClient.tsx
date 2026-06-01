"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import Link from "next/link";
import { ArrowLeft, Play, ExternalLink, MessageCircle, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

interface ServiceProfileClientProps {
  profile: any;
  media: any[];
}

export default function ServiceProfileClient({
  profile,
  media,
}: ServiceProfileClientProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);

  const sortedMedia = [...media].sort((a, b) => a.sort_order - b.sort_order);
  const images = sortedMedia.filter(m => m.media_type === "image");
  const videos = sortedMedia.filter(m => m.media_type === "video").slice(0, 2);
  const displayedMedia = [...videos, ...images];

  const handlePrevMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeMediaIndex === null || displayedMedia.length <= 1) return;
    setActiveMediaIndex((prev) => (prev !== null ? (prev - 1 + displayedMedia.length) % displayedMedia.length : null));
  };

  const handleNextMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (activeMediaIndex === null || displayedMedia.length <= 1) return;
    setActiveMediaIndex((prev) => (prev !== null ? (prev + 1) % displayedMedia.length : null));
  };

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 50;
    if (diffX > threshold) {
      handleNextMedia();
    } else if (diffX < -threshold) {
      handlePrevMedia();
    }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (activeMediaIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevMedia();
      else if (e.key === "ArrowRight") handleNextMedia();
      else if (e.key === "Escape") setActiveMediaIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMediaIndex]);
  
  // Find primary image (lowest sort_order image) or default
  const primaryImage = images[0]?.url || "/placeholder-service.jpg";

  // Construct store full address for map embed
  const fullAddress = [
    profile.address_line,
    profile.cities?.name,
    profile.states?.name,
    profile.countries?.name
  ].filter(Boolean).join(", ");

  return (
    <div className={styles.container}>
      {/* Navigation Breadcrumbs */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
        <Link href="/" className={styles.backBtn} style={{ gap: '4px' }}>
          <ArrowLeft size={14} />
          <span>Home</span>
        </Link>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>/</span>
        <Link href="/services" className={styles.backBtn}>
          <span>Services Directory</span>
        </Link>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>/</span>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
          {profile.business_name}
        </span>
      </div>

      {/* 1. Dynamic Premium Cover Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerFlex}>
          <div className={styles.avatarContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primaryImage}
              alt={profile.business_name}
              className={styles.avatar}
            />
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{profile.business_name}</h1>
              <span className={styles.roleBadge}>
                {profile.provider_type === "business_owner" ? "Business Owner" : 
                 profile.provider_type === "freelancer" ? "Freelancer" : "Local Business"}
              </span>
            </div>
            {profile.tagline && (
              <p style={{ margin: '0 0 var(--space-3) 0', color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', fontStyle: 'italic' }}>
                "{profile.tagline}"
              </p>
            )}
            <div className={styles.metaRow}>
              {profile.categories && (
                <span className={styles.categoryTag}>{profile.categories.name}</span>
              )}
              {profile.cities && (
                <span className={styles.location}>📍 {profile.cities.name}, {profile.states?.name}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className={styles.mainGrid}>
        {/* Left column (About description + Media Gallery) */}
        <div className={styles.panel}>
          {/* Description */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>About this Service</h3>
            <p className={styles.bioText}>
              {profile.description || "No description provided."}
            </p>
          </div>

          {/* Portfolio Media Showcase */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Work & Gallery Showcase</h3>
            {sortedMedia.length === 0 ? (
              <div className={styles.emptyGallery}>
                <p>No gallery uploads available yet.</p>
                <small style={{ color: "var(--color-text-muted)", display: "block", marginTop: 4 }}>
                  Stay tuned for updates from this service provider!
                </small>
              </div>
            ) : (
              <div className={styles.showcaseContainer}>
                {videos.length > 0 && (
                  <div className={styles.showcaseColumn}>
                    <h4 className={styles.showcaseSubTitle}>
                      🎥 Videos Showcase
                    </h4>
                    <div className={styles.portfolioGrid}>
                      {videos.map((item) => {
                        const originalIndex = displayedMedia.findIndex(m => m.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className={styles.portfolioItem}
                            onClick={() => setActiveMediaIndex(originalIndex)}
                          >
                            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                              <video
                                src={item.url}
                                className={styles.galleryMedia}
                                muted
                                preload="metadata"
                              />
                              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "rgba(0,0,0,0.6)", borderRadius: "50%", padding: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Play size={18} style={{ color: "white", fill: "white", marginLeft: 2 }} />
                              </div>
                            </div>
                            <span className={styles.videoOverlay}>Video</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {images.length > 0 && (
                  <div className={styles.showcaseColumn}>
                    <h4 className={styles.showcaseSubTitle}>
                      📷 Photos Gallery
                    </h4>
                    <div className={styles.portfolioGrid}>
                      {images.map((item) => {
                        const originalIndex = displayedMedia.findIndex(m => m.id === item.id);
                        return (
                          <div
                            key={item.id}
                            className={styles.portfolioItem}
                            onClick={() => setActiveMediaIndex(originalIndex)}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.url}
                              alt="Business Piece"
                              className={styles.galleryMedia}
                              loading="lazy"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column (Contact Details, Location, and External Links) */}
        <div className={styles.panel}>
          {/* Quick Connect / Contact Details */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Quick Connect</h3>
            
            <div className={styles.contactContainer}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                Get in touch directly with this service provider.
              </p>

              {profile.contact_type === "whatsapp" && profile.whatsapp_number ? (
                <a
                  href={`https://wa.me/${profile.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.directContactBtn}
                  style={{ background: 'hsl(142, 70%, 45%)', borderColor: 'hsl(142, 70%, 40%)' }}
                >
                  <MessageCircle size={20} />
                  <span>Chat on WhatsApp</span>
                </a>
              ) : (
                <a
                  href={`tel:${profile.contact_number}`}
                  className={styles.directContactBtn}
                  style={{ background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                >
                  <Phone size={20} />
                  <span>Call Now</span>
                </a>
              )}

              {profile.contact_number && profile.contact_type === "whatsapp" && (
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Backup Contact Number:</span>
                  <a href={`tel:${profile.contact_number}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textDecoration: 'none', fontWeight: 'var(--weight-semibold)' }}>
                    📞 {profile.contact_number}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Location & Details Panel */}
          <div className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>Details</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Category</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)' }}>
                  {profile.categories?.name || "N/A"}
                </span>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Service Area</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', display: 'block', marginBottom: 'var(--space-3)' }}>
                  📍 {profile.address_line ? `${profile.address_line}, ` : ""}{profile.cities?.name}, {profile.states?.name}, {profile.countries?.name}
                </span>
                {(() => {
                  if (profile.provider_type === 'freelancer') return null;
                  const getMapSrc = (embedInput: string) => {
                    if (!embedInput) return "";
                    if (embedInput.includes("<iframe")) {
                      const match = embedInput.match(/src=["']([^"']+)["']/);
                      return match ? match[1] : "";
                    }
                    return embedInput;
                  };

                  const customMapSrc = getMapSrc(profile.map_embed_url || "");
                  const mapSrc = customMapSrc;

                  if (!mapSrc) return null;

                  return (
                    <div className={styles.mapWrapper}>
                      <iframe
                        title="Store Location Map"
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={mapSrc}
                      />
                    </div>
                  );
                })()}
              </div>

              {profile.website_url && (
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Website</span>
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.webLink}
                  >
                    <span>Visit Website</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Interactive Full-Screen Lightbox Preview */}
      {activeMediaIndex !== null && (
        <div 
          className={styles.lightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top metadata row (Close button + Counter) */}
          <div className={styles.lightboxHeader}>
            {displayedMedia.length > 1 && (
              <div className={styles.lightboxCounter}>
                {activeMediaIndex + 1} / {displayedMedia.length}
              </div>
            )}
            <button
              className={styles.lightboxClose}
              onClick={() => setActiveMediaIndex(null)}
              aria-label="Close preview"
            >
              &times;
            </button>
          </div>
          
          <div className={styles.lightboxContentContainer}>
            {displayedMedia.length > 1 && (
              <button 
                className={`${styles.lightboxArrow} ${styles.lightboxArrowLeft}`} 
                onClick={handlePrevMedia}
                aria-label="Previous media"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <div className={styles.lightboxContent}>
              {displayedMedia[activeMediaIndex].media_type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayedMedia[activeMediaIndex].url}
                  alt="Fullscreen work gallery piece"
                  className={styles.lightboxImage}
                />
              ) : (
                <video
                  src={displayedMedia[activeMediaIndex].url}
                  className={styles.lightboxVideo}
                  controls
                  autoPlay
                />
              )}
            </div>

            {displayedMedia.length > 1 && (
              <button 
                className={`${styles.lightboxArrow} ${styles.lightboxArrowRight}`} 
                onClick={handleNextMedia}
                aria-label="Next media"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
