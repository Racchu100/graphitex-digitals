"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import {
  approveBusinessProfile,
  rejectBusinessProfile,
  suspendBusinessProfile,
  reactivateBusinessProfile,
} from "../../actions";

interface BusinessDetailsActionsProps {
  profileId: string;
  currentStatus: string;
}

export default function BusinessDetailsActions({ profileId, currentStatus }: BusinessDetailsActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [showSuspendPanel, setShowSuspendPanel] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleApprove = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      await approveBusinessProfile(profileId);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to approve profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    try {
      setLoading(true);
      setErrorMsg("");
      await rejectBusinessProfile(profileId, reason);
      setShowRejectPanel(false);
      setReason("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reject profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!reason.trim()) return;
    try {
      setLoading(true);
      setErrorMsg("");
      await suspendBusinessProfile(profileId, reason);
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
      await reactivateBusinessProfile(profileId);
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
        {(currentStatus === "pending_approval" || currentStatus === "draft" || currentStatus === "rejected") && (
          <Button onClick={handleApprove} loading={loading} style={{ background: "hsl(145, 60%, 35%)", color: "white" }}>
            Approve Profile
          </Button>
        )}

        {currentStatus === "pending_approval" && !showRejectPanel && (
          <Button variant="danger" onClick={() => { setShowRejectPanel(true); setShowSuspendPanel(false); setReason(""); }}>
            Reject
          </Button>
        )}

        {currentStatus === "approved" && !showSuspendPanel && (
          <Button variant="danger" onClick={() => { setShowSuspendPanel(true); setShowRejectPanel(false); setReason(""); }}>
            Suspend
          </Button>
        )}

        {currentStatus === "suspended" && (
          <Button onClick={handleReactivate} loading={loading} style={{ background: "hsl(220, 70%, 45%)", color: "white" }}>
            Reactivate Profile
          </Button>
        )}
      </div>

      {showRejectPanel && (
        <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(0, 40%, 25%)", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
          <h4 style={{ color: "hsl(0, 70%, 65%)", margin: "0 0 12px 0", fontSize: "15px" }}>Specify Rejection Reason</h4>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please write why this business profile is rejected (sent to provider)..."
            style={{ width: "100%", background: "hsl(220, 18%, 8%)", color: "hsl(220, 15%, 85%)", border: "1px solid hsl(220, 18%, 20%)", borderRadius: "8px", padding: "12px", outline: "none", resize: "none", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", justifyContent: "flex-end" }}>
            <Button size="sm" variant="ghost" onClick={() => setShowRejectPanel(false)}>Cancel</Button>
            <Button size="sm" variant="danger" disabled={!reason.trim()} loading={loading} onClick={handleReject}>
              Confirm Reject
            </Button>
          </div>
        </div>
      )}

      {showSuspendPanel && (
        <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(0, 40%, 25%)", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
          <h4 style={{ color: "hsl(0, 70%, 65%)", margin: "0 0 12px 0", fontSize: "15px" }}>Reason for Suspension</h4>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Specify suspension context..."
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
