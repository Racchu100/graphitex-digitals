"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./ServiceForm.module.css"; // Reuse similar styles
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import { InfluencerProfile, InfluencerSocialAccount } from "@/types/database";
import { Upload } from "lucide-react";
import { compressImageToWebP } from "@/lib/utils/imageCompressor";

interface InfluencerFormProps {
  initialData?: InfluencerProfile & { influencer_social_accounts?: InfluencerSocialAccount[] };
}

function extractHandle(platform: string, url: string): string {
  if (!url) return "";
  try {
    const cleanedUrl = url.trim().replace(/\/$/, ""); // remove trailing slash
    const parts = cleanedUrl.split("/");
    const lastPart = parts[parts.length - 1];

    if (platform === "instagram") {
      return lastPart.split("?")[0];
    } else if (platform === "youtube") {
      const handle = lastPart.split("?")[0];
      return handle.startsWith("@") ? handle : "@" + handle;
    } else if (platform === "facebook") {
      return lastPart.split("?")[0];
    }
  } catch (e) {
    // fallback
  }
  return "";
}


export default function InfluencerForm({ initialData }: InfluencerFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [submitType, setSubmitType] = useState<'draft' | 'published' | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const [selectedNicheIds, setSelectedNicheIds] = useState<number[]>(
    (initialData as any)?.niche_category_ids || 
    (initialData?.niche_category_id ? [initialData.niche_category_id] : [])
  );

  const [fetchingStats, setFetchingStats] = useState<Record<number, boolean>>({});

  const handleUrlBlur = async (index: number) => {
    const social = socials[index];
    if (!social.profile_url || !social.platform) return;

    let rawUrl = social.profile_url.trim();
    let extracted = social.handle || "";

    // If it is just a handle, format it as a valid absolute URL first
    if (rawUrl && !rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      const clean = rawUrl.replace(/^@/, "");
      if (social.platform === "instagram") {
        rawUrl = `https://instagram.com/${clean}`;
      } else if (social.platform === "youtube") {
        rawUrl = `https://youtube.com/${clean.startsWith("@") ? clean : "@" + clean}`;
      } else if (social.platform === "facebook") {
        rawUrl = `https://facebook.com/${clean}`;
      } else {
        rawUrl = `https://${clean}`;
      }
    }

    // Auto-extract handle
    const newExtracted = extractHandle(social.platform, rawUrl);
    if (newExtracted && !extracted) {
      extracted = newExtracted;
    }

    setSocials(prev => {
      const next = [...prev];
      next[index] = { 
        ...next[index], 
        profile_url: rawUrl, 
        handle: extracted 
      };
      return next;
    });

    // 2. Trigger auto-fetch for follower count
    setFetchingStats(prev => ({ ...prev, [index]: true }));
    try {
      const res = await fetch("/api/social/fetch-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          platform: social.platform, 
          url: rawUrl, 
          handle: extracted 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.follower_count !== undefined) {
          setSocials(prev => {
            const next = [...prev];
            next[index].follower_count = data.follower_count;
            return next;
          });
        }
      }
    } catch (e) {
      console.error("Failed to auto-fetch stats:", e);
    } finally {
      setFetchingStats(prev => ({ ...prev, [index]: false }));
    }
  };

  // Parse bio and media portfolio details
  const parsedBioInfo = React.useMemo(() => {
    if (!initialData?.bio) return { bio: "", media: [] };
    try {
      if (initialData.bio.trim().startsWith("{")) {
        const parsed = JSON.parse(initialData.bio);
        if (parsed && typeof parsed === "object" && "bio" in parsed) {
          return {
            bio: parsed.bio || "",
            media: Array.isArray(parsed.media) ? parsed.media : [],
          };
        }
      }
    } catch (e) {
      // Ignore parse failure, fall back to plain text
    }
    return { bio: initialData.bio, media: [] };
  }, [initialData?.bio]);

  const [formData, setFormData] = useState({
    display_name: initialData?.display_name || "",
    bio: parsedBioInfo.bio,
    niche_category_id: initialData?.niche_category_id || "",
    price_min: initialData?.price_min || "",
    price_max: initialData?.price_max || "",
    profile_picture_url: initialData?.profile_picture_url || "",
  });

  const [influencerMedia, setInfluencerMedia] = useState<{ type: 'image' | 'video'; url: string }[]>(
    parsedBioInfo.media
  );
  const [mediaUploading, setMediaUploading] = useState(false);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setMediaUploading(true);
    setError("");

    try {
      const currentImagesCount = influencerMedia.filter(m => m.type === "image").length;
      const currentVideosCount = influencerMedia.filter(m => m.type === "video").length;

      let imagesToBeAdded = 0;
      let videosToBeAdded = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          throw new Error("Only images and videos are supported.");
        }

        if (isImage) imagesToBeAdded++;
        if (isVideo) videosToBeAdded++;
      }

      if (currentImagesCount + imagesToBeAdded > 3) {
        alert("You can upload a maximum of 3 images.");
        throw new Error("You can upload a maximum of 3 images.");
      }
      if (currentVideosCount + videosToBeAdded > 2) {
        alert("You can upload a maximum of 2 videos.");
        throw new Error("You can upload a maximum of 2 videos.");
      }

      const newMedia = [...influencerMedia];
      
      for (let i = 0; i < files.length; i++) {
        const rawFile = files[i];
        const isImage = rawFile.type.startsWith("image/");
        const isVideo = rawFile.type.startsWith("video/");

        const file = await compressImageToWebP(rawFile);

        if (isImage && file.size > 10 * 1024 * 1024) throw new Error("Image exceeds 10MB limit.");
        if (isVideo && file.size > 100 * 1024 * 1024) throw new Error("Video exceeds 100MB limit.");

        const fileExt = file.type.startsWith("image/") ? "webp" : (file.name.split(".").pop() || "png");
        const customPath = `${user?.id || 'temp'}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("bucket", "business-media");
        uploadData.append("path", customPath);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload media.");
        }

        const { url } = await response.json();
        newMedia.push({
          type: isImage ? "image" : "video",
          url,
        });
      }

      setInfluencerMedia(newMedia);
    } catch (err: any) {
      setError(err.message || "Failed to upload media.");
    } finally {
      setMediaUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveMedia = (index: number) => {
    setInfluencerMedia(influencerMedia.filter((_, i) => i !== index));
  };

  const [socials, setSocials] = useState<Partial<InfluencerSocialAccount>[]>(
    initialData?.influencer_social_accounts || []
  );

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').eq('is_active', true);
      if (data) setCategories(data);
    }
    fetchCategories();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectNiche = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    if (!value) return;
    if (selectedNicheIds.includes(value)) return;
    setSelectedNicheIds([...selectedNicheIds, value]);
  };

  const handleRemoveNiche = (id: number) => {
    setSelectedNicheIds(selectedNicheIds.filter(nId => nId !== id));
  };

  const handleSocialChange = (index: number, field: keyof InfluencerSocialAccount, value: any) => {
    const updated = [...socials];
    updated[index] = { ...updated[index], [field]: value };
    setSocials(updated);
  };

  const addSocial = () => {
    setSocials([...socials, { platform: 'instagram', profile_url: '', handle: '', follower_count: 0 }]);
  };

  const removeSocial = (index: number) => {
    setSocials(socials.filter((_, i) => i !== index));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setLoading(true);
    setError("");
    try {
      const file = await compressImageToWebP(rawFile);
      const fileExt = file.type.startsWith("image/") ? "webp" : (file.name.split('.').pop() || "png");
      const customPath = `${user?.id || 'temp'}/avatar-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("bucket", "profile-pictures");
      uploadData.append("path", customPath);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image.");
      }

      const { url } = await response.json();
      setFormData(prev => ({ ...prev, profile_picture_url: url }));
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    console.log("[InfluencerForm] handleSubmit triggered with status:", status);
    setSubmitType(status);
    setLoading(true);
    setError("");

    try {
      console.log("[InfluencerForm] Utilizing reactive user resolved from hook:", user);
      if (!user) throw new Error("Authentication required. Please log in again.");

      // 1. Fetch user's actual location values from users table to prevent foreign key errors
      console.log("[InfluencerForm] Fetching location details from users table for user ID:", user.id);
      const { data: dbUser, error: dbUserError } = await supabase
        .from('users')
        .select('country_id, state_id, city_id')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log("[InfluencerForm] dbUser location details fetched:", dbUser, "Error (if any):", dbUserError);
      if (dbUserError) {
        console.warn("[InfluencerForm] Error fetching dbUser locations:", dbUserError);
      }

      // 2. Double check if profile already exists in DB to prevent UNIQUE constraint violation on user_id
      console.log("[InfluencerForm] Checking if profile already exists for user ID:", user.id);
      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('influencer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log("[InfluencerForm] existingProfile fetched:", existingProfile, "Error (if any):", existingProfileError);
      if (existingProfileError) {
        console.warn("[InfluencerForm] Error fetching existingProfile:", existingProfileError);
      }

      // Client-side Price validation
      const minPrice = parseFloat(formData.price_min as string) || 0;
      const maxPrice = parseFloat(formData.price_max as string) || 0;

      if (maxPrice < minPrice) {
        throw new Error("Maximum price must be greater than or equal to minimum price.");
      }

      // Filter active socials (must have platform and a non-empty URL)
      const activeSocials = socials.filter(s => s.platform && s.profile_url?.trim());
      console.log("[InfluencerForm] Active socials filtered:", activeSocials);

      // Published validation requirements
      if (status === 'published') {
        if (!formData.profile_picture_url) {
          throw new Error("Published profiles require a profile picture. Please upload an avatar above.");
        }
        if (selectedNicheIds.length === 0) {
          throw new Error("Published profiles require at least one niche category.");
        }
        if (activeSocials.length === 0) {
          throw new Error("Published profiles require at least one social account with a valid profile URL.");
        }
      }

      const payload = {
        user_id: user.id,
        display_name: formData.display_name,
        bio: JSON.stringify({
          bio: formData.bio,
          media: influencerMedia,
        }),
        niche_category_id: selectedNicheIds.length > 0 ? selectedNicheIds[0] : null,
        niche_category_ids: selectedNicheIds,
        price_min: minPrice,
        price_max: maxPrice,
        profile_picture_url: formData.profile_picture_url,
        country_id: dbUser?.country_id || 1,
        state_id: dbUser?.state_id || 1,
        city_id: dbUser?.city_id || 1,
        status: status,
        is_public: status === 'published',
      };

      console.log("[InfluencerForm] Prepared payload for influencer_profiles:", payload);

      let profileId = existingProfile?.id || initialData?.id;
      console.log("[InfluencerForm] Profile ID resolved to:", profileId);

      if (profileId) {
        console.log("[InfluencerForm] Performing profile update for ID:", profileId);
        const { error: updateError } = await supabase
          .from('influencer_profiles')
          .update(payload)
          .eq('id', profileId);
        console.log("[InfluencerForm] Profile update completed. Error (if any):", updateError);
        if (updateError) throw updateError;
      } else {
        console.log("[InfluencerForm] Performing profile insert...");
        const { data: inserted, error: insertError } = await supabase
          .from('influencer_profiles')
          .insert(payload)
          .select()
          .single();
        console.log("[InfluencerForm] Profile insert completed. Inserted row:", inserted, "Error (if any):", insertError);
        if (insertError) throw insertError;
        profileId = inserted.id;
      }

      // Handle socials logic with strict error checking to prevent silent DB fails
      if (profileId) {
         console.log("[InfluencerForm] Deleting old socials for profile ID:", profileId);
         const { error: deleteSocialsError } = await supabase
           .from('influencer_social_accounts')
           .delete()
           .eq('influencer_profile_id', profileId);
         
         console.log("[InfluencerForm] Socials delete completed. Error (if any):", deleteSocialsError);
         if (deleteSocialsError) {
           throw new Error(`Failed to update social accounts: ${deleteSocialsError.message}`);
         }

         if (activeSocials.length > 0) {
            const socialPayload = activeSocials.map(s => {
              let rawUrl = s.profile_url?.trim() || "";
              if (rawUrl && !rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
                const clean = rawUrl.replace(/^@/, "");
                if (s.platform === "instagram") {
                  rawUrl = `https://instagram.com/${clean}`;
                } else if (s.platform === "youtube") {
                  rawUrl = `https://youtube.com/${clean.startsWith("@") ? clean : "@" + clean}`;
                } else if (s.platform === "facebook") {
                  rawUrl = `https://facebook.com/${clean}`;
                } else {
                  rawUrl = `https://${clean}`;
                }
              }
              return {
                influencer_profile_id: profileId,
                platform: s.platform,
                profile_url: rawUrl,
                handle: s.handle?.trim() || null,
                follower_count: parseInt(s.follower_count as any) || 0,
                count_source: 'manual',
              };
            });

            console.log("[InfluencerForm] Inserting social accounts payload:", socialPayload);
            const { error: insertSocialsError } = await supabase
              .from('influencer_social_accounts')
              .insert(socialPayload);

            console.log("[InfluencerForm] Socials insert completed. Error (if any):", insertSocialsError);
            if (insertSocialsError) {
              throw new Error(`Failed to save social accounts: ${insertSocialsError.message}`);
            }
         }
      }

      console.log("[InfluencerForm] Database operations finished successfully. Calling router.refresh()...");
      router.refresh();
      window.scrollTo(0,0);

      setSuccess(
        status === 'published' 
          ? "Profile published successfully! Redirecting..." 
          : "Profile draft saved successfully! Redirecting..."
      );

      setTimeout(() => {
        router.push("/services");
      }, 1500);
    } catch (err: any) {
      console.warn("[InfluencerForm] handleSubmit validation error:", err.message || err);
      setError(err.message || "An error occurred while saving.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      console.log("[InfluencerForm] handleSubmit finally block reached, setting loading=false, submitType=null");
      setLoading(false);
      setSubmitType(null);
    }
  };

  return (
    <Card padding="lg" className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      
      {success && (
        <div style={{
          padding: "var(--space-4)",
          background: "rgba(16, 185, 129, 0.08)",
          color: "rgb(16, 185, 129)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "var(--radius-md)",
          marginBottom: "var(--space-5)",
          fontSize: "var(--text-sm)",
          fontWeight: "var(--weight-medium)"
        }}>
          {success}
        </div>
      )}
      
      <form className={styles.form}>
        <div className={styles.section} style={{ alignItems: 'center' }}>
          <label style={{ cursor: 'pointer', position: 'relative' }}>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={formData.profile_picture_url || "/placeholder-avatar.png"} 
              alt="Avatar" 
              style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
            />
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--color-primary)', padding: 8, borderRadius: '50%', color: 'white' }}>
              <Upload size={16} />
            </div>
          </label>
        </div>

        <div className={styles.section}>
          <h3>Basic Information</h3>
          <Input label="Display Name *" name="display_name" value={formData.display_name} onChange={handleChange} required />
          
          <div className={styles.field}>
             <label className={styles.label}>Bio</label>
             <textarea 
               name="bio" 
               className={styles.textarea}
               value={formData.bio}
               onChange={handleChange}
               rows={4}
             />
          </div>

          <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)' }}>
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)', marginBottom: '4px' }}>Portfolio Showcase (Images & Videos)</h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}>
              Upload high-quality images and video clips to show off your content creation capabilities to brands.
            </p>
            
            <div style={{
              padding: 'var(--space-5)',
              border: '2.5px dashed var(--color-border)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              background: 'var(--color-surface-elevated)',
              marginBottom: 'var(--space-4)',
              transition: 'border-color 0.2s ease',
              position: 'relative'
            }}>
              <input
                type="file"
                id="portfolio-media-file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                disabled={mediaUploading}
                style={{ display: 'none' }}
              />
              <label htmlFor="portfolio-media-file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Upload size={28} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                  {mediaUploading ? 'Uploading to portfolio...' : 'Click here to upload images or videos'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  Upload up to 3 images and 2 videos. (Images: max 10MB, Videos: max 100MB)
                </span>
              </label>
            </div>

            {influencerMedia.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                {influencerMedia.map((item, idx) => (
                  <div key={idx} style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '1', border: '1px solid var(--color-border)', background: 'black', boxShadow: 'var(--shadow-sm)' }}>
                    {item.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.url} alt="Portfolio item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted preload="metadata" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        lineHeight: 1
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      &times;
                    </button>
                    {item.type === 'video' && (
                      <span style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        background: 'rgba(99, 102, 241, 0.95)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}>
                        Video
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-1)" }}>
               <label className={styles.label}>Niche Categories *</label>
               <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", fontWeight: "var(--weight-semibold)" }}>
                 {selectedNicheIds.length} selected
               </span>
             </div>
             
             {/* Selected tags */}
             {selectedNicheIds.length > 0 && (
               <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                 {selectedNicheIds.map(id => {
                   const category = categories.find(c => c.id === id);
                   if (!category) return null;
                   return (
                     <div 
                       key={id} 
                       style={{ 
                         display: "flex", 
                         alignItems: "center", 
                         gap: "var(--space-2)", 
                         padding: "6px 14px", 
                         background: "hsla(263, 60%, 50%, 0.08)", 
                         border: "1px solid hsla(263, 60%, 50%, 0.18)", 
                         borderRadius: "100px", 
                         color: "hsl(263, 60%, 30%)", 
                         fontSize: "var(--text-sm)",
                         fontWeight: "var(--weight-semibold)",
                         transition: "all var(--duration-fast) var(--ease-out)"
                       }}
                     >
                       <span>{category.name}</span>
                       <button 
                         type="button" 
                         onClick={() => handleRemoveNiche(id)}
                         style={{ 
                           background: "none", 
                           border: "none", 
                           color: "hsl(263, 60%, 40%)", 
                           cursor: "pointer", 
                           fontSize: "18px",
                           lineHeight: 1,
                           padding: 0,
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                           width: "18px",
                           height: "18px",
                           borderRadius: "50%",
                           transition: "background var(--duration-fast) var(--ease-out)"
                         }}
                         onMouseEnter={(e) => e.currentTarget.style.background = "hsla(263, 60%, 50%, 0.15)"}
                         onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                       >
                         &times;
                       </button>
                     </div>
                   );
                 })}
               </div>
             )}

              <select 
                name="niche_category_select" 
                value="" 
                onChange={handleSelectNiche} 
                className={styles.select}
              >
                 <option value="">Add category...</option>
                 {categories
                   .filter(c => !selectedNicheIds.includes(c.id))
                   .map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))
                 }
              </select>
          </div>
        </div>

        <div className={styles.section}>
           <h3>Pricing (INR)</h3>
           <div className={styles.row}>
             <Input label="Minimum Price" name="price_min" type="number" value={formData.price_min} onChange={handleChange} required />
             <Input label="Maximum Price" name="price_max" type="number" value={formData.price_max} onChange={handleChange} required />
           </div>
        </div>

        <div className={styles.section}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', minWidth: 0, overflow: 'hidden' }}>
             <h3 style={{ margin: 0 }}>Social Accounts</h3>
             <Button type="button" variant="outline" size="sm" onClick={addSocial}>+ Add Account</Button>
           </div>
           
           {socials.map((social, idx) => (
             <div key={idx} style={{ padding: 'var(--space-4)', background: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', border: '1px solid var(--color-border)', transition: 'all 0.2s ease' }}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Platform</label>
                    <select 
                      value={social.platform} 
                      onChange={e => {
                        handleSocialChange(idx, 'platform', e.target.value);
                        if (social.profile_url) {
                          setTimeout(() => handleUrlBlur(idx), 50);
                        }
                      }} 
                      className={styles.select}
                    >
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </div>
                  <Input 
                    label={fetchingStats[idx] ? "Follower Count (Fetching...)" : "Follower Count"} 
                    type="number" 
                    value={social.follower_count as any} 
                    onChange={e => handleSocialChange(idx, 'follower_count', e.target.value)} 
                    placeholder={fetchingStats[idx] ? "Analyzing..." : "Followers count"}
                    style={fetchingStats[idx] ? { border: "1.5px solid var(--color-primary)", color: "var(--color-primary)", fontWeight: "var(--weight-semibold)" } : {}}
                    disabled={fetchingStats[idx]}
                  />
                </div>
                <div className={styles.row}>
                  <Input 
                    label="Profile URL" 
                    value={social.profile_url} 
                    onChange={e => handleSocialChange(idx, 'profile_url', e.target.value)} 
                    onBlur={() => handleUrlBlur(idx)}
                    placeholder={social.platform === "instagram" ? "e.g. https://instagram.com/username" : social.platform === "youtube" ? "e.g. https://youtube.com/@channel" : "Enter profile URL"}
                  />
                  <Input 
                    label="Handle" 
                    value={social.handle || ""} 
                    onChange={e => handleSocialChange(idx, 'handle', e.target.value)} 
                    placeholder="e.g. username"
                  />
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                   <Button type="button" variant="danger" size="sm" onClick={() => removeSocial(idx)}>Remove</Button>
                </div>
             </div>
           ))}
        </div>

        <div className={styles.actions}>
          <Button 
            type="button" 
            variant="outline" 
            onClick={(e) => handleSubmit(e, 'draft')} 
            loading={loading && submitType === 'draft'}
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button 
            type="button" 
            onClick={(e) => handleSubmit(e, 'published')} 
            loading={loading && submitType === 'published'}
            disabled={loading}
          >
            Publish Profile
          </Button>
        </div>
      </form>
    </Card>
  );
}
