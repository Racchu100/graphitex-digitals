"use client";

import React, { useState } from "react";
import styles from "./ApprovalQueue.module.css";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface ApprovalQueueProps {
  profiles: any[];
}

export default function ApprovalQueue({ profiles: initial }: ApprovalQueueProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    const res = await fetch(`/api/admin/business-profiles/${id}/approve`, { method: "POST" });
    if (res.ok) {
      setProfiles(p => p.filter(x => x.id !== id));
      showToast("Profile approved successfully.");
    }
    setLoadingId(null);
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setLoadingId(id);
    await fetch(`/api/admin/business-profiles/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    setProfiles(p => p.filter(x => x.id !== id));
    setRejectingId(null);
    setRejectReason("");
    showToast("Profile rejected.");
    setLoadingId(null);
  };

  if (profiles.length === 0) {
    return (
      <div className={styles.empty}>
        <h3>All Clear!</h3>
        <p>No pending approvals right now.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {toastMsg && <div className={styles.toast}>{toastMsg}</div>}

      <div className={styles.list}>
        {profiles.map(profile => (
          <div key={profile.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.name}>{profile.business_name}</h3>
                <p className={styles.meta}>
                  by {profile.users?.name} · {profile.categories?.name} · {profile.cities?.name}
                </p>
                <p className={styles.date}>
                  Submitted {new Date(profile.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <div className={styles.actions}>
                <Button
                  size="sm"
                  onClick={() => handleApprove(profile.id)}
                  loading={loadingId === profile.id}
                  className={styles.approveBtn}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => { setRejectingId(profile.id); setRejectReason(""); }}
                  disabled={loadingId === profile.id}
                >
                  Reject
                </Button>
              </div>
            </div>

            {/* Media Preview */}
            {profile.business_media?.length > 0 && (
              <div className={styles.mediaRow}>
                {profile.business_media.slice(0, 4).map((m: any) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={m.url} src={m.url} alt="" className={styles.thumb} />
                ))}
              </div>
            )}

            <div className={styles.description}>{profile.description}</div>

            {/* Reject Reason Input */}
            {rejectingId === profile.id && (
              <div className={styles.rejectPanel}>
                <label>Rejection Reason (required)</label>
                <textarea
                  rows={3}
                  placeholder="Explain why the profile is being rejected..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
                <div className={styles.rejectActions}>
                  <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={!rejectReason.trim()}
                    loading={loadingId === profile.id}
                    onClick={() => handleReject(profile.id)}
                  >
                    Confirm Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
