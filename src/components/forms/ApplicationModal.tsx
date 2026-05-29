"use client";

import React, { useState } from "react";
import styles from "./ApplicationModal.module.css";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { sendInAppNotification } from "@/app/actions/notifications";

interface ApplicationModalProps {
  opportunityId: string;
  opportunityTitle: string;
  influencerProfileId: string;
  onClose: () => void;
}

export default function ApplicationModal({ opportunityId, opportunityTitle, influencerProfileId, onClose }: ApplicationModalProps) {
  const supabase = createClient();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: submitError } = await supabase
        .from('opportunity_applications')
        .insert({
          opportunity_id: opportunityId,
          influencer_profile_id: influencerProfileId,
          message: message || null
        });

      if (submitError) {
        if (submitError.code === '23505') throw new Error("You have already applied to this opportunity.");
        throw submitError;
      }

      // Send in-app notification to the opportunity owner (Brand Owner)
      try {
        const { data: oppData } = await supabase
          .from('opportunities')
          .select('title, business_profile:business_profiles(user_id)')
          .eq('id', opportunityId)
          .single();

        if (oppData) {
          const bp = oppData.business_profile as any;
          if (bp && bp.user_id) {
            await sendInAppNotification(
              bp.user_id,
              'new_application',
              'New Opportunity Application! 🚀',
              `An influencer has applied to your campaign "${oppData.title}". Check your dashboard to view the details!`,
              { opportunity_id: opportunityId }
            );
          }
        }
      } catch (notifErr) {
        console.warn("Failed to trigger application notification:", notifErr);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h3>Apply to: {opportunityTitle}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {success ? (
          <div className={styles.successState}>
             <div className={styles.checkmark}>✓</div>
             <h4>Application Submitted!</h4>
             <p>The provider will review your profile.</p>
          </div>
        ) : (
          <form className={styles.body} onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}
            
            <p className={styles.infoText}>
              Your public influencer profile will be shared with the provider.
            </p>

            <div className={styles.field}>
              <label>Message (Optional)</label>
              <textarea 
                rows={4}
                placeholder="Write a short pitch to the provider..."
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <div className={styles.footer}>
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" loading={loading}>Submit Application</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
