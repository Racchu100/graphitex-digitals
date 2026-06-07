"use client";

import React from "react";
import Link from "next/link";
import styles from "./ComingSoon.module.css";

interface ComingSoonProps {
  type: "services" | "influencers" | "opportunities";
  /** When true, the logged-in user is a provider/influencer and has a profile */
  hasOwnProfile?: boolean;
  /** Slug or ID to link to their own profile */
  ownProfilePath?: string;
  /** Display name of the profile */
  ownProfileName?: string;
  /** Custom secondary button path and text for opportunities */
  secondaryBtnPath?: string;
  secondaryBtnText?: string;
}

export default function ComingSoon({
  type,
  hasOwnProfile = false,
  ownProfilePath,
  ownProfileName,
  secondaryBtnPath,
  secondaryBtnText,
}: ComingSoonProps) {
  const isServices = type === "services";
  const isInfluencers = type === "influencers";
  const isOpportunities = type === "opportunities";

  return (
    <div className={styles.wrapper}>
      {/* Animated background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />

      <div className={styles.inner}>
        {/* Badge */}
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          {isServices && "Services Directory"}
          {isInfluencers && "Influencer Directory"}
          {isOpportunities && "Opportunities Directory"}
        </div>

        {/* Headline */}
        <h1 className={styles.heading}>
          We&apos;re <span className={styles.highlight}>Launching Soon</span>
        </h1>

        <p className={styles.subheading}>
          {isServices && "Our curated services marketplace is being carefully built. Verified local businesses and freelancers will be listed here once we go live."}
          {isInfluencers && "Our influencer discovery platform is coming to life. Verified creators and content specialists will appear here at launch."}
          {isOpportunities && "Our brand collaboration and campaign directory is gearing up. Verified marketing campaigns and creator opportunities will be listed here soon."}
        </p>

        {/* Feature pills */}
        <div className={styles.pills}>
          {isServices && (
            <>
              <span className={styles.pill}>📸 Photography & Video</span>
              <span className={styles.pill}>👗 Fashion & Clothing</span>
              <span className={styles.pill}>💻 Tech & Gadgets</span>
              <span className={styles.pill}>🍽 Food & Restaurants</span>
              <span className={styles.pill}>✨ Beauty & Wellness</span>
            </>
          )}
          {isInfluencers && (
            <>
              <span className={styles.pill}>📱 Instagram Creators</span>
              <span className={styles.pill}>🎥 YouTube Channels</span>
              <span className={styles.pill}>🌟 Fashion Influencers</span>
              <span className={styles.pill}>🍕 Food Bloggers</span>
              <span className={styles.pill}>✈️ Travel Creators</span>
            </>
          )}
          {isOpportunities && (
            <>
              <span className={styles.pill}>🎯 Paid Sponsorships</span>
              <span className={styles.pill}>🎁 Barter Campaigns</span>
              <span className={styles.pill}>📣 Brand Ambassadorships</span>
              <span className={styles.pill}>📈 Grow Your Reach</span>
              <span className={styles.pill}>💼 Creative Gigs</span>
            </>
          )}
        </div>

        {/* CTA */}
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            Back to Home
          </Link>
          {isOpportunities ? (
            secondaryBtnPath && secondaryBtnText && (
              <Link href={secondaryBtnPath} className={styles.secondaryBtn}>
                {secondaryBtnText}
              </Link>
            )
          ) : (
            <Link
              href={isServices ? "/dashboard/profile?tab=service" : "/dashboard/profile?tab=influencer"}
              className={styles.secondaryBtn}
            >
              {isServices ? "Manage My Listing" : "Manage My Profile"}
            </Link>
          )}
        </div>

        {/* Own profile card if user has one */}
        {!isOpportunities && hasOwnProfile && ownProfilePath && (
          <div className={styles.ownProfileCard}>
            <div className={styles.ownProfileIcon}>
              {isServices ? "🏪" : "🎭"}
            </div>
            <div className={styles.ownProfileInfo}>
              <p className={styles.ownProfileLabel}>Your profile is live and ready:</p>
              <p className={styles.ownProfileName}>{ownProfileName}</p>
            </div>
            <Link href={ownProfilePath} className={styles.viewProfileBtn}>
              View My Profile →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
