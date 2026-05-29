"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { sendInAppNotification } from "@/app/actions/notifications";

interface ApplicationActionsProps {
  applicationId: number;
  currentStatus: string;
  opportunityId: string;
  influencerProfileId: string;
  influencerUserId: string;
  opportunityTitle: string;
  businessWhatsapp: string;
}

export default function ApplicationActions({
  applicationId,
  currentStatus,
  opportunityId,
  influencerProfileId,
  influencerUserId,
  opportunityTitle,
  businessWhatsapp,
}: ApplicationActionsProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('opportunity_applications')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (!error) {
      try {
        if (influencerUserId && opportunityTitle) {
          let title = "";
          let body = "";
          if (newStatus === 'accepted') {
            title = "Application Approved! 🎉";
            body = `Congratulations! Your application to "${opportunityTitle}" has been approved. You can now contact the brand owner on WhatsApp!`;
          } else if (newStatus === 'rejected') {
            title = "Application Status Update 📩";
            body = `Thank you for applying to "${opportunityTitle}". Unfortunately, the provider has decided not to proceed with your application at this time.`;
          }

          if (title) {
            await sendInAppNotification(
              influencerUserId,
              `application_${newStatus}`,
              title,
              body,
              { 
                opportunity_id: opportunityId, 
                application_id: applicationId,
                whatsapp_number: businessWhatsapp 
              }
            );
          }
        }
      } catch (notifErr) {
        console.warn("Failed to trigger application status update notification:", notifErr);
      }
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {currentStatus !== 'rejected' && currentStatus !== 'accepted' && (
        <>
          <Button
            size="sm"
            onClick={() => updateStatus('accepted')}
            loading={loading}
          >
            Approve
          </Button>

          <Button size="sm" variant="danger" onClick={() => updateStatus('rejected')} loading={loading}>
            Reject
          </Button>
        </>
      )}

      {currentStatus === 'accepted' && (
        <span style={{ color: 'hsl(140 60% 50%)', fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
          Approved ✓
        </span>
      )}

      {currentStatus === 'rejected' && (
        <span style={{ color: 'hsl(0 70% 60%)', fontSize: 'var(--text-sm)' }}>
          Rejected
        </span>
      )}
    </div>
  );
}
