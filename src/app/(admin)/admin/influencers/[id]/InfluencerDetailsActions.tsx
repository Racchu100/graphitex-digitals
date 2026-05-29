"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { suspendInfluencerProfile, reactivateInfluencerProfile } from "../../actions";

interface InfluencerDetailsActionsProps {
  profileId: string;
  currentStatus: string;
}

export default function InfluencerDetailsActions({ profileId, currentStatus }: InfluencerDetailsActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuspendPanel, setShowSuspendPanel] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSuspend = async () => {
    if (!reason.trim()) return;
    try {
      setLoading(true);
      setErrorMsg("");
      await suspendInfluencerProfile(profileId, reason);
      setShowSuspendPanel(false);
      setReason("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to suspend profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      await reactivateInfluencerProfile(profileId);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reactivate profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "24px" }}>
      {errorMsg && (
        <div style={{ color: "hsl(0, 70%, 60%)", background: "hsl(0, 40%, 10%)", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        {(currentStatus === "published" || currentStatus === "draft") && !showSuspendPanel && (
          <Button variant="danger" onClick={() => { setShowSuspendPanel(true); setReason(""); }}>
            Suspend Profile
          </Button>
        )}

        {currentStatus === "suspended" && (
          <Button onClick={handleReactivate} loading={loading} style={{ background: "hsl(220, 70%, 45%)", color: "white" }}>
            Reactivate Profile
          </Button>
        )}
      </div>

      {showSuspendPanel && (
        <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(0, 40%, 25%)", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
          <h4 style={{ color: "hsl(0, 70%, 65%)", margin: "0 0 12px 0", fontSize: "15px" }}>Reason for Suspension</h4>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Specify why this influencer profile is suspended (sent to user)..."
            style={{ width: "100%", background: "hsl(220, 18%, 8%)", color: "hsl(220, 15%, 85%)", border: "1px solid hsl(220, 18%, 20%)", borderRadius: "8px", padding: "12px", outline: "none", resize: "none", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", justifyContent: "flex-end" }}>
            <Button size="sm" variant="ghost" onClick={() => setShowSuspendPanel(false)}>Cancel</Button>
            <Button size="sm" variant="danger" disabled={!reason.trim()} loading={loading} onClick={handleSuspend}>
              Confirm Suspend
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
