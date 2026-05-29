"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import ApplicationModal from "@/components/forms/ApplicationModal";
import styles from "./ApplySection.module.css";
import Link from "next/link";

interface ApplySectionProps {
  opportunityId: string;
  opportunityTitle: string;
  opportunityStatus: string;
  influencerProfile: { id: string; display_name: string } | null;
  existingApplication: { id: number; status: string } | null;
  isLoggedIn: boolean;
  userRole: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  applied: "Application Submitted",
  viewed: "Profile Viewed",
  contacted: "Provider Contacted You",
  accepted: "Accepted 🎉",
  rejected: "Not Selected",
};

export default function ApplySection({
  opportunityId,
  opportunityTitle,
  opportunityStatus,
  influencerProfile,
  existingApplication,
  isLoggedIn,
  userRole,
}: ApplySectionProps) {
  const [showModal, setShowModal] = useState(false);

  if (opportunityStatus !== 'active') {
    return (
      <div className={styles.card}>
        <div className={styles.closedState}>
          <span>🔒</span>
          <p>This opportunity is no longer accepting applications.</p>
        </div>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className={styles.card}>
        <h3>Your Application</h3>
        <div className={styles.statusBadge} data-status={existingApplication.status}>
          {STATUS_LABELS[existingApplication.status] || existingApplication.status}
        </div>
        <p className={styles.hint}>The provider will contact you if interested.</p>
        <Link href="/dashboard/applications" className={styles.dashboardLink}>
          View in Dashboard →
        </Link>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.card}>
        <h3>Apply to this Opportunity</h3>
        <p className={styles.hint}>Please log in as an Influencer to apply to this opportunity.</p>
        <Link href="/login">
          <Button style={{ width: '100%', marginTop: 'var(--space-3)' }}>Login / Register</Button>
        </Link>
      </div>
    );
  }

  if (userRole !== 'influencer') {
    return (
      <div className={styles.card} style={{ background: 'hsla(0, 0%, 50%, 0.04)', borderColor: 'var(--color-border)' }}>
        <h3 style={{ color: 'var(--color-text-primary)' }}>Influencers Only</h3>
        <p className={styles.hint} style={{ color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
          Only registered Influencers with active profiles can apply to campaign opportunities. Since you are registered as a Brand Provider, you cannot apply.
        </p>
      </div>
    );
  }

  if (!influencerProfile) {
    return (
      <div className={styles.card}>
        <h3>Apply to this Opportunity</h3>
        <p className={styles.hint}>You need a published influencer profile to apply.</p>
        <Link href="/dashboard/profile">
          <Button style={{ width: '100%', marginTop: 'var(--space-3)' }}>Set Up Profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={styles.card}>
        <h3>Ready to Apply?</h3>
        <p className={styles.hint}>
          Applying as <strong>{influencerProfile.display_name}</strong>. Your profile will be shared with the provider.
        </p>
        <Button style={{ width: '100%', marginTop: 'var(--space-3)' }} onClick={() => setShowModal(true)}>
          Apply Now
        </Button>
      </div>

      {showModal && (
        <ApplicationModal
          opportunityId={opportunityId}
          opportunityTitle={opportunityTitle}
          influencerProfileId={influencerProfile.id}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
