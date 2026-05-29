"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { updatePlatformConfig } from "../actions";

interface ConfigConsoleProps {
  configs: any[];
}

export default function ConfigConsole({ configs }: ConfigConsoleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async (key: string) => {
    if (!editValue.trim()) return;
    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      await updatePlatformConfig(key, editValue);
      setEditingKey(null);
      setSuccessMsg(`Setting "${key}" updated successfully.`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update platform settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px", color: "hsl(220, 15%, 85%)" }}>
      <h2 style={{ color: "white", fontSize: "18px", margin: "0 0 16px 0", borderBottom: "1px solid hsl(220, 18%, 18%)", paddingBottom: "12px" }}>
        Platform Settings Properties
      </h2>

      {successMsg && (
        <div style={{ background: "hsl(145, 40%, 10%)", color: "hsl(145, 60%, 50%)", padding: "10px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: "hsl(0, 40%, 10%)", color: "hsl(0, 70%, 60%)", padding: "10px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {configs.map((cfg) => {
          const isEditing = editingKey === cfg.key;

          return (
            <div key={cfg.key} style={{ padding: "16px", background: "hsl(220, 18%, 8%)", border: "1px solid hsl(220, 18%, 16%)", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ flex: 1, minWidth: "240px" }}>
                <h3 style={{ color: "white", margin: "0 0 4px 0", fontSize: "14px", fontFamily: "monospace", letterSpacing: "0.02em" }}>
                  {cfg.key}
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "hsl(220, 15%, 55%)" }}>
                  {cfg.description || "No description provided."}
                </p>
                {cfg.updated_at && (
                  <span style={{ display: "block", fontSize: "11px", color: "hsl(220, 15%, 40%)", marginTop: "6px" }}>
                    Last modified: {new Date(cfg.updated_at).toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "220px", justifyContent: "flex-end" }}>
                {isEditing ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      style={{ background: "hsl(220, 18%, 12%)", color: "white", border: "1px solid hsl(220, 18%, 22%)", padding: "6px 10px", borderRadius: "6px", fontSize: "13px", width: "120px" }}
                    />
                    <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>Cancel</Button>
                    <Button size="sm" disabled={loading} onClick={() => handleSave(cfg.key)}>Save</Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <span style={{ color: "hsl(38, 90%, 60%)", fontWeight: "var(--weight-bold)", fontSize: "16px", fontFamily: "monospace" }}>
                      {cfg.value}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingKey(cfg.key);
                        setEditValue(cfg.value);
                      }}
                    >
                      Edit Value
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
