"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { removeOpportunity } from "../../actions";

interface OpportunityDetailsActionsProps {
  oppId: string;
  currentStatus: string;
}

export default function OpportunityDetailsActions({ oppId, currentStatus }: OpportunityDetailsActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showRemovePanel, setShowRemovePanel] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleRemove = async () => {
    if (!reason.trim()) return;
    try {
      setLoading(true);
      setErrorMsg("");
      await removeOpportunity(oppId, reason);
      setShowRemovePanel(false);
      setReason("");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove opportunity.");
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
        {currentStatus === "active" && !showRemovePanel && (
          <Button variant="danger" onClick={() => { setShowRemovePanel(true); setReason(""); }}>
            Remove Opportunity
          </Button>
        )}

        {currentStatus === "removed" && (
          <p style={{ color: "hsl(0, 70%, 60%)", margin: 0, fontSize: "14px", fontWeight: "var(--weight-semibold)" }}>
            This opportunity was removed by administrator.
          </p>
        )}
      </div>

      {showRemovePanel && (
        <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(0, 40%, 25%)", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
          <h4 style={{ color: "hsl(0, 70%, 65%)", margin: "0 0 12px 0", fontSize: "15px" }}>Reason for Removal</h4>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this opportunity is being removed (sent to brand owner)..."
            style={{ width: "100%", background: "hsl(220, 18%, 8%)", color: "hsl(220, 15%, 85%)", border: "1px solid hsl(220, 18%, 20%)", borderRadius: "8px", padding: "12px", outline: "none", resize: "none", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", justifyContent: "flex-end" }}>
            <Button size="sm" variant="ghost" onClick={() => setShowRemovePanel(false)}>Cancel</Button>
            <Button size="sm" variant="danger" disabled={!reason.trim()} loading={loading} onClick={handleRemove}>
              Confirm Removal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
