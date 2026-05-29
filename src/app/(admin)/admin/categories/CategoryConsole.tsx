"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { createCategory, updateCategory, mergeCategories } from "../actions";

interface CategoryConsoleProps {
  categories: any[];
}

export default function CategoryConsole({ categories }: CategoryConsoleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newParent, setNewParent] = useState("");

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editParent, setEditParent] = useState("");
  const [editActive, setEditActive] = useState(true);

  // Merge Form State
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) return;
    try {
      setLoading(true);
      setErrorMsg("");
      await createCategory(newName, newSlug, newParent || null);
      setNewName("");
      setNewSlug("");
      setNewParent("");
      showSuccess("Category created successfully!");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create category.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editSlug.trim()) return;
    try {
      setLoading(true);
      setErrorMsg("");
      await updateCategory(id, editName, editSlug, editParent || null, editActive);
      setEditingId(null);
      showSuccess("Category updated successfully!");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update category.");
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeSource || !mergeTarget) return;
    if (mergeSource === mergeTarget) {
      setErrorMsg("Source and target categories must differ.");
      return;
    }
    if (!confirm("Are you sure? This moves all business listings and influencer niches to the target category, child nodes will be reparented, and the source category will be deactivated.")) {
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");
      await mergeCategories(mergeSource, mergeTarget);
      setMergeSource("");
      setMergeTarget("");
      showSuccess("Categories merged and reparented successfully!");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to merge categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (cat: any) => {
    try {
      setLoading(true);
      setErrorMsg("");
      await updateCategory(
        String(cat.id),
        cat.name,
        cat.slug,
        cat.parent_id ? String(cat.parent_id) : null,
        !cat.is_active
      );
      showSuccess(`Category status toggled!`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update category status.");
    } finally {
      setLoading(false);
    }
  };

  // Build top-level category mappings
  const parentLookup = categories.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", color: "hsl(220, 15%, 85%)" }}>
      {/* Left side: Category tree/list */}
      <div>
        <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ color: "white", fontSize: "18px", margin: "0 0 16px 0" }}>Category Taxonomy</h2>
          
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

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {categories.map((cat) => {
              const isEditing = editingId === String(cat.id);
              const parentName = cat.parent_id ? parentLookup[cat.parent_id] : null;

              return (
                <div key={cat.id} style={{ background: "hsl(220, 18%, 8%)", border: "1px solid hsl(220, 18%, 16%)", borderRadius: "12px", padding: "16px" }}>
                  {isEditing ? (
                    // Edit Form Mode
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ fontSize: "11px", color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ width: "100%", background: "hsl(220, 18%, 12%)", color: "white", border: "1px solid hsl(220, 18%, 20%)", padding: "6px 10px", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Slug</label>
                          <input
                            type="text"
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            style={{ width: "100%", background: "hsl(220, 18%, 12%)", color: "white", border: "1px solid hsl(220, 18%, 20%)", padding: "6px 10px", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "10px", alignItems: "center" }}>
                        <div>
                          <label style={{ fontSize: "11px", color: "hsl(220, 15%, 50%)", display: "block", marginBottom: "4px" }}>Parent Category</label>
                          <select
                            value={editParent}
                            onChange={(e) => setEditParent(e.target.value)}
                            style={{ width: "100%", background: "hsl(220, 18%, 12%)", color: "white", border: "1px solid hsl(220, 18%, 20%)", padding: "6px", borderRadius: "6px", fontSize: "13px" }}
                          >
                            <option value="">Top Level (No Parent)</option>
                            {categories
                              .filter((c) => String(c.id) !== String(cat.id) && !c.parent_id)
                              .map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                          </select>
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer", color: "white", marginTop: "16px" }}>
                          <input
                            type="checkbox"
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                          />
                          Is Active Node
                        </label>
                      </div>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "4px" }}>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button size="sm" disabled={loading} onClick={() => handleUpdate(String(cat.id))}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "var(--weight-semibold)", color: "white", fontSize: "15px" }}>{cat.name}</span>
                          <span style={{ fontSize: "11px", background: cat.is_active ? "hsl(145, 40%, 10%)" : "hsl(0, 40%, 12%)", color: cat.is_active ? "hsl(145, 60%, 50%)" : "hsl(0, 70%, 60%)", padding: "2px 6px", borderRadius: "4px" }}>
                            {cat.is_active ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "hsl(220, 15%, 50%)" }}>
                          Slug: <code>{cat.slug}</code> {parentName && `· Parent: ${parentName}`}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(String(cat.id));
                            setEditName(cat.name);
                            setEditSlug(cat.slug);
                            setEditParent(cat.parent_id ? String(cat.parent_id) : "");
                            setEditActive(cat.is_active);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={cat.is_active ? "danger" : "ghost"}
                          disabled={loading}
                          onClick={() => handleToggleActive(cat)}
                        >
                          {cat.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right side: Add and Merge forms */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Create Category */}
        <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
          <h3 style={{ color: "white", margin: "0 0 16px 0", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
            Add New Category
          </h3>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "hsl(220, 15%, 55%)", display: "block", marginBottom: "6px" }}>Category Name</label>
              <input
                type="text"
                placeholder="e.g. Photography & Video"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  // Auto-generate slug
                  setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                }}
                style={{ width: "100%", background: "hsl(220, 18%, 8%)", color: "white", border: "1px solid hsl(220, 18%, 20%)", padding: "8px 12px", borderRadius: "8px", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "hsl(220, 15%, 55%)", display: "block", marginBottom: "6px" }}>Category Slug</label>
              <input
                type="text"
                placeholder="e.g. photography-video"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                style={{ width: "100%", background: "hsl(220, 18%, 8%)", color: "white", border: "1px solid hsl(220, 18%, 20%)", padding: "8px 12px", borderRadius: "8px", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "hsl(220, 15%, 55%)", display: "block", marginBottom: "6px" }}>Parent Category (Optional)</label>
              <select
                value={newParent}
                onChange={(e) => setNewParent(e.target.value)}
                style={{ width: "100%", background: "hsl(220, 18%, 8%)", color: "white", border: "1px solid hsl(220, 18%, 20%)", padding: "8px 12px", borderRadius: "8px", outline: "none", fontSize: "14px" }}
              >
                <option value="">Top Level (No Parent)</option>
                {categories
                  .filter((c) => !c.parent_id && c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <Button disabled={loading || !newName.trim() || !newSlug.trim()} style={{ marginTop: "8px" }}>
              Create Category Node
            </Button>
          </form>
        </div>

        {/* Merge Categories */}
        <div style={{ background: "hsl(220, 18%, 12%)", border: "1px solid hsl(220, 18%, 18%)", borderRadius: "16px", padding: "24px" }}>
          <h3 style={{ color: "white", margin: "0 0 16px 0", fontSize: "16px", borderBottom: "1px solid hsl(220, 18%, 20%)", paddingBottom: "10px" }}>
            Merge Categories
          </h3>
          <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "hsl(220, 15%, 55%)", lineHeight: "1.4" }}>
            Move all active listings and niche definitions from a source category to a target, then disable the source.
          </p>
          <form onSubmit={handleMerge} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", color: "hsl(220, 15%, 55%)", display: "block", marginBottom: "6px" }}>Source Category (To Merge From)</label>
              <select
                value={mergeSource}
                onChange={(e) => setMergeSource(e.target.value)}
                style={{ width: "100%", background: "hsl(220, 18%, 8%)", color: "white", border: "1px solid hsl(220, 18%, 20%)", padding: "8px 12px", borderRadius: "8px", outline: "none", fontSize: "14px" }}
              >
                <option value="">Select source category...</option>
                {categories
                  .filter((c) => c.is_active)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "13px", color: "hsl(220, 15%, 55%)", display: "block", marginBottom: "6px" }}>Target Category (To Move Into)</label>
              <select
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                style={{ width: "100%", background: "hsl(220, 18%, 8%)", color: "white", border: "1px solid hsl(220, 18%, 20%)", padding: "8px 12px", borderRadius: "8px", outline: "none", fontSize: "14px" }}
              >
                <option value="">Select target category...</option>
                {categories
                  .filter((c) => c.is_active && String(c.id) !== mergeSource)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <Button variant="danger" disabled={loading || !mergeSource || !mergeTarget} style={{ marginTop: "8px" }}>
              Merge & Reassign Listings
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
