"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { suspendUser, reactivateUser, grantRole, revokeRole } from "../../actions";

interface UserDetailsActionsProps {
  userId: string;
  currentStatus: string;
  currentRoles: string[];
}

export default function UserDetailsActions({ userId, currentStatus, currentRoles }: UserDetailsActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuspendPanel, setShowSuspendPanel] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleStatusToggle = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      if (currentStatus === "active") {
        if (!reason.trim()) return;
        await suspendUser(userId, reason);
        setShowSuspendPanel(false);
      } else {
        await reactivateUser(userId);
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update user status.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (role: string, isAssigned: boolean) => {
    try {
      setLoading(true);
      setErrorMsg("");
      if (isAssigned) {
        // Confirmation dialog when removing admin role or granting roles
        if (role === "admin" && !confirm("Are you sure you want to revoke Admin rights from this user?")) return;
        await revokeRole(userId, role);
      } else {
        if (role === "admin" && !confirm("WARNING: Granting Admin role allows this user full platform access. Proceed?")) return;
        await grantRole(userId, role);
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update user roles.");
    } finally {
      setLoading(false);
    }
  };

  const rolesCatalog = ["admin", "provider", "influencer"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {errorMsg && (
        <div style={{ color: "hsl(0, 70%, 60%)", background: "hsl(0, 40%, 10%)", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
          {errorMsg}
        </div>
      )}

      {/* Role Management Card */}
      <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
        <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
          Role Assignments (RBAC)
        </h3>
        <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "hsl(220, 15%, 55%)" }}>
          Toggle platform roles. Changes take effect on next reload.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rolesCatalog.map((role) => {
            const isAssigned = currentRoles.includes(role);
            return (
              <label key={role} style={{ display: "flex", alignItems: "center", gap: "10px", color: "white", fontSize: "14px", cursor: "pointer", padding: "10px", background: "hsl(220, 18%, 8%)", borderRadius: "8px", border: "1px solid hsl(220, 18%, 16%)" }}>
                <input
                  type="checkbox"
                  checked={isAssigned}
                  disabled={loading}
                  onChange={() => handleRoleToggle(role, isAssigned)}
                  style={{ width: "16px", height: "16px", accentColor: "hsl(220, 90%, 65%)" }}
                />
                <span style={{ textTransform: "capitalize", fontWeight: "var(--weight-semibold)" }}>{role}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Status Moderation Card */}
      <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
        <h3 style={{ color: "white", marginTop: 0, marginBottom: "16px", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
          Account Status Controls
        </h3>
        {currentStatus === "active" ? (
          <div>
            {!showSuspendPanel ? (
              <Button variant="danger" disabled={loading} onClick={() => { setShowSuspendPanel(true); setReason(""); }}>
                Suspend Account
              </Button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label style={{ fontSize: "13px", color: "hsl(0, 70%, 65%)" }}>Specify Suspension Reason</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter context for account suspension..."
                  style={{ width: "100%", background: "hsl(220, 18%, 8%)", color: "white", border: "1px solid hsl(220, 18%, 20%)", borderRadius: "8px", padding: "10px", resize: "none", outline: "none", fontSize: "13px" }}
                />
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <Button size="sm" variant="ghost" onClick={() => setShowSuspendPanel(false)}>Cancel</Button>
                  <Button size="sm" variant="danger" disabled={!reason.trim()} loading={loading} onClick={handleStatusToggle}>
                    Confirm Suspend
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button onClick={handleStatusToggle} loading={loading} style={{ background: "hsl(145, 60%, 35%)", color: "white" }}>
            Reactivate Account
          </Button>
        )}
      </div>
    </div>
  );
}
