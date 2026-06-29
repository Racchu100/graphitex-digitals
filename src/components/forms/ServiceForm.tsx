"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import styles from "./ServiceForm.module.css";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { BusinessProfile, ProviderSubtype } from "@/types/database";
import MediaUploader from "./MediaUploader";
import { Upload, MapPin, AlertCircle } from "lucide-react";
import { getInfluencerSlug } from "@/lib/utils/slug";
import { compressImageToWebP } from "@/lib/utils/imageCompressor";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => <p style={{ padding: "var(--space-4)", color: "var(--color-text-secondary)" }}>Loading interactive map picker...</p>
});

interface ServiceFormProps {
  initialData?: Partial<BusinessProfile>;
  isEdit?: boolean;
  onSuccess?: (submitAction?: 'draft' | 'pending_approval' | 'approved') => void;
}

export default function ServiceForm({ initialData, isEdit, onSuccess }: ServiceFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // Map Picker States
  const [showMap, setShowMap] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [locationError, setLocationError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    business_name: initialData?.business_name || "",
    provider_type: initialData?.provider_type || "local_service",
    tagline: initialData?.tagline || "",
    description: initialData?.description || "",
    category_id: initialData?.category_id || "",
    contact_type: initialData?.contact_type || "whatsapp",
    whatsapp_number: initialData?.whatsapp_number || "",
    contact_number: initialData?.contact_number || "",
    website_url: initialData?.website_url || "",
    instagram_handle: initialData?.instagram_handle || "",
    map_embed_url: initialData?.map_embed_url || "",
    address_line: initialData?.address_line || "",
    country_id: initialData?.country_id || "1", // Hardcoded default for scaffolding
    state_id: initialData?.state_id || "1",
    city_id: initialData?.city_id || "1",
    latitude: initialData?.latitude ? String(initialData.latitude) : "",
    longitude: initialData?.longitude ? String(initialData.longitude) : "",
  });

  const freelanceSlugs = [
    'graphic-design',
    'content-writing',
    'web-app-development',
    'video-editing',
    'social-media-management',
    'digital-marketing-seo',
    'ui-ux-design',
    'voiceover-audio',
    'consulting-strategy',
    'translation-languages',
    'photography-videography'
  ];

  const filteredCategories = categories.filter(c => {
    const isFreelance = freelanceSlugs.includes(c.slug);
    return formData.provider_type === 'freelancer' ? isFreelance : !isFreelance;
  });

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').eq('is_active', true);
      if (data) setCategories(data);
    }
    fetchCategories();
  }, [supabase]);

  useEffect(() => {
    async function fetchUserLocation() {
      if (!isEdit && !initialData?.id) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (user) {
          const { data: dbUser } = await supabase
            .from('users')
            .select('country_id, state_id, city_id')
            .eq('id', user.id)
            .maybeSingle();

          const { data: dbRole } = await supabase
            .from('user_roles')
            .select('provider_subtype')
            .eq('user_id', user.id)
            .eq('role', 'provider')
            .maybeSingle();

          if (dbUser || dbRole) {
            setFormData(prev => ({
              ...prev,
              country_id: dbUser?.country_id ? String(dbUser.country_id) : prev.country_id,
              state_id: dbUser?.state_id ? String(dbUser.state_id) : prev.state_id,
              city_id: dbUser?.city_id ? String(dbUser.city_id) : prev.city_id,
              provider_type: dbRole?.provider_subtype ? dbRole.provider_subtype : prev.provider_type,
            }));
          }
        }
      }
    }
    fetchUserLocation();
  }, [isEdit, initialData?.id, supabase]);

  useEffect(() => {
    const profileId = initialData?.id;
    if (isEdit && profileId) {
      async function fetchThumbnail() {
        const { data } = await supabase
          .from('business_media')
          .select('url')
          .eq('business_profile_id', profileId)
          .eq('media_type', 'image')
          .order('sort_order', { ascending: true })
          .limit(1);

        if (data && data.length > 0) {
          setThumbnailUrl(data[0].url);
        }
      }
      fetchThumbnail();
    }
  }, [isEdit, initialData?.id, supabase]);

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    setThumbnailUploading(true);
    setError("");
    try {
      const file = await compressImageToWebP(rawFile);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const fileExt = file.type.startsWith("image/") ? "webp" : (file.name.split('.').pop() || "png");
      const businessSlug = getInfluencerSlug(formData.business_name) || "service";
      const customPath = `services/${businessSlug}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

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
        throw new Error(errorData.error || "Failed to upload image.");
      }

      const { url } = await response.json();
      setThumbnailUrl(url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "provider_type") {
      setFormData(prev => ({
        ...prev,
        provider_type: value as ProviderSubtype,
        category_id: "", // Reset category when switching provider type to avoid mismatch
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    setLocationMessage("");
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: String(latitude.toFixed(6)),
          longitude: String(longitude.toFixed(6))
        }));

        try {
          const res = await fetch(`/api/locations/reverse?lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              setFormData(prev => ({
                ...prev,
                address_line: data.display_name
              }));
              setLocationMessage("Current location detected and address resolved successfully.");
            } else {
              setLocationMessage(`Current location coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) detected successfully.`);
            }
          }
        } catch (err) {
          setLocationMessage(`Current location coordinates (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) detected, but address could not be resolved.`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please allow location access in your browser.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable. Please choose on map instead.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again or choose on map.");
            break;
          default:
            setLocationError("An unknown error occurred while retrieving location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent, submitAction: 'draft' | 'pending_approval' | 'approved') => {
    e.preventDefault();
    if (loading) return; // Prevent double submissions
    console.log("ServiceForm handleSubmit debug - isEdit:", isEdit, "profileId:", initialData?.id, "initialData:", initialData);
    setLoading(true);
    try {
      setError("");
      // 0. Comprehensive Client-Side Validations to prevent database check constraint crashes
      if (!formData.business_name?.trim()) {
        throw new Error(`${formData.provider_type === "freelancer" ? "Freelancer Name" : "Business Name"} is required.`);
      }
      if (!formData.category_id) {
        throw new Error("Category selection is required.");
      }
      if (!formData.description?.trim()) {
        throw new Error("Description is required.");
      }
      if (formData.provider_type !== 'freelancer' && !formData.address_line?.trim()) {
        throw new Error("Shop Location (Exact Address) is required.");
      }

      // Check contact criteria to satisfy PostgreSQL CHECK constraint (business_profiles_check)
      if (formData.contact_type === 'whatsapp' && !formData.whatsapp_number?.trim()) {
        throw new Error("WhatsApp Number is required to publish this profile.");
      }
      if (formData.contact_type === 'phone' && !formData.contact_number?.trim()) {
        throw new Error("Phone Number is required to publish this profile.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Authentication required. Please log in again.");

      const payload: any = {
        user_id: user.id,
        business_name: formData.business_name,
        provider_type: formData.provider_type,
        tagline: formData.tagline,
        description: formData.description,
        category_id: parseInt(formData.category_id as string),
        contact_type: formData.contact_type,
        whatsapp_number: formData.whatsapp_number || null,
        contact_number: formData.contact_number || null,
        website_url: formData.website_url || null,
        instagram_handle: formData.instagram_handle || null,
        address_line: formData.provider_type === 'freelancer' ? null : (formData.address_line || null),
        country_id: parseInt(formData.country_id as string) || 1,
        state_id: parseInt(formData.state_id as string) || 1,
        city_id: parseInt(formData.city_id as string) || 1,
        status: initialData?.status === 'approved' ? 'approved' : submitAction,
        is_public: initialData?.status === 'approved' ? (initialData.is_public ?? true) : false,
        map_embed_url: (formData.provider_type !== 'freelancer' && formData.map_embed_url?.trim()) ? formData.map_embed_url.trim() : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      let profileId = initialData?.id;

      // Helper function to handle media upsert
      const upsertMedia = async (targetProfileId: string) => {
        if (!thumbnailUrl) return;
        const { data: existingMedia } = await supabase
          .from('business_media')
          .select('id')
          .eq('business_profile_id', targetProfileId)
          .eq('media_type', 'image')
          .order('sort_order', { ascending: true })
          .limit(1);

        if (existingMedia && existingMedia.length > 0) {
          const { error: mediaUpdateErr } = await supabase
            .from('business_media')
            .update({ url: thumbnailUrl })
            .eq('id', existingMedia[0].id);
          if (mediaUpdateErr) throw mediaUpdateErr;
        } else {
          const { error: mediaInsertErr } = await supabase
            .from('business_media')
            .insert({
              business_profile_id: targetProfileId,
              media_type: 'image',
              url: thumbnailUrl,
              sort_order: 0,
            });
          if (mediaInsertErr) throw mediaInsertErr;
        }
      };

      if (profileId) {
        // Run profile update and media upsert concurrently
        const updatePromise = supabase
          .from('business_profiles')
          .update(payload)
          .eq('id', profileId)
          .then(({ error }: { error: any }) => { if (error) throw error; });
        
        const mediaPromise = upsertMedia(profileId);
        
        await Promise.all([updatePromise, mediaPromise]);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('business_profiles')
          .insert(payload)
          .select()
          .single();
        if (insertError) throw insertError;
        profileId = inserted.id;

        if (thumbnailUrl && profileId) {
          await upsertMedia(profileId);
        }
      }

      if (initialData?.status === 'approved' || submitAction === 'draft') {
        router.push('/dashboard/profile?tab=services');
      } else {
        router.push('/dashboard/profile?tab=services&showProviderStatusAlert=true');
      }

      if (onSuccess) {
        onSuccess(submitAction);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg" className={styles.container}>
      {error && <div className={styles.errorDesktop}>{error}</div>}
      
      <form className={styles.form}>
        <div className={styles.section}>
          <h3>Basic Information</h3>

          <div style={{ marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-5)' }}>
            <label className={styles.label} style={{ display: 'block', marginBottom: '8px' }}>Service Thumbnail Image</label>
            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
                background: 'var(--color-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0
              }}>
                {thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbnailUrl} alt="Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '4px' }}>No Thumbnail</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="file"
                  id="service-thumbnail-file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={thumbnailUploading}
                  style={{ display: 'none' }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} 
                  onClick={() => document.getElementById('service-thumbnail-file')?.click()}
                  loading={thumbnailUploading}
                >
                  <Upload size={14} />
                  {thumbnailUrl ? 'Change Image' : 'Upload Image'}
                </Button>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginTop: '6px', marginBottom: 0 }}>
                  This image will be displayed as the main thumbnail card preview in the services directory list. Supports JPEG, PNG, WebP (max 10MB).
                </p>
              </div>
            </div>
          </div>

          <Input
            label={formData.provider_type === "freelancer" ? "Freelancer Name" : "Business Name"}
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            required
          />
          <Input
            label="Tagline (Optional)"
            name="tagline"
            value={formData.tagline}
            onChange={handleChange}
            placeholder="e.g. Best photography in town"
          />
          
          <div className={styles.field}>
             <label className={styles.label}>Description *</label>
             <textarea 
               name="description" 
               className={styles.textarea}
               value={formData.description}
               onChange={handleChange}
               required
               rows={5}
             />
          </div>

          {formData.provider_type !== 'freelancer' && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", border: "1px dashed var(--color-border)", padding: "var(--space-4)", borderRadius: "var(--radius-md)", background: "rgba(99, 102, 241, 0.02)", width: "100%" }}>
              <Input
                label="Shop Location (Exact Address) *"
                name="address_line"
                value={formData.address_line}
                onChange={handleChange}
                placeholder="Enter exact address or use geocoding below..."
                required
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
                <span className={styles.label} style={{ fontWeight: "var(--weight-bold)" }}>Business Location Selection</span>
              </div>
              
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                <Button 
                  type="button" 
                  onClick={handleUseCurrentLocation} 
                  loading={detectingLocation}
                  style={{ background: "hsl(263, 60%, 45%)", color: "white" }}
                >
                  📍 Use Current Location
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowMap(true);
                    setLocationMessage("");
                    setLocationError("");
                  }}
                  style={{ borderColor: "hsl(263, 60%, 45%)", color: "hsl(263, 60%, 45%)" }}
                >
                  🗺️ Choose on Map
                </Button>
              </div>

              {locationMessage && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontSize: "var(--text-sm)", background: "rgba(16, 185, 129, 0.08)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)" }}>
                  <span>✓</span>
                  <span>{locationMessage}</span>
                </div>
              )}

              {locationError && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgb(239, 68, 68)", fontSize: "var(--text-sm)", background: "rgba(239, 68, 68, 0.08)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)" }}>
                  <AlertCircle size={16} />
                  <span>{locationError}</span>
                </div>
              )}

              <div className={styles.row}>
                <Input
                  label="Latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Auto-filled latitude"
                  disabled
                  style={{ opacity: 0.8, cursor: "not-allowed" }}
                />
                <Input
                  label="Longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Auto-filled longitude"
                  disabled
                  style={{ opacity: 0.8, cursor: "not-allowed" }}
                />
              </div>

              {/* Glassmorphic Map Overlay Modal */}
              {mounted && showMap && (
                <div style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0, 0, 0, 0.5)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 9999,
                  padding: "var(--space-4)"
                }}>
                  <div style={{
                    background: "var(--color-surface, #ffffff)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-5)",
                    maxWidth: "600px",
                    width: "100%",
                    boxShadow: "var(--shadow-xl)",
                    maxHeight: "90vh",
                    overflowY: "auto"
                  }}>
                    <LocationPickerMap
                      initialLat={formData.latitude ? parseFloat(formData.latitude) : null}
                      initialLng={formData.longitude ? parseFloat(formData.longitude) : null}
                      onConfirm={(lat, lng) => {
                        setFormData(prev => ({
                          ...prev,
                          latitude: String(lat),
                          longitude: String(lng)
                        }));
                        setLocationMessage("Location coordinates pinned on map successfully.");
                        setShowMap(false);
                      }}
                      onCancel={() => setShowMap(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.row}>
             <div className={styles.field}>
                <label className={styles.label}>Provider Type *</label>
                <select name="provider_type" value={formData.provider_type} onChange={handleChange} className={styles.select} required>
                   <option value="freelancer" disabled>Freelancer (Currently Unavailable)</option>
                   <option value="local_service">Local Business</option>
                </select>
             </div>
             <div className={styles.field}>
                <label className={styles.label}>Category *</label>
                <select name="category_id" value={formData.category_id} onChange={handleChange} className={styles.select} required>
                   <option value="">Select Category...</option>
                   {filteredCategories.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                </select>
             </div>
          </div>
        </div>

        <div className={styles.section}>
           <h3>Contact Details</h3>
           <div className={styles.row}>
             <div className={styles.field}>
                <label className={styles.label}>Contact Method *</label>
                <select name="contact_type" value={formData.contact_type} onChange={handleChange} className={styles.select} required>
                   <option value="whatsapp">WhatsApp</option>
                   <option value="phone">Phone Call</option>
                </select>
             </div>
             
             {formData.contact_type === 'whatsapp' ? (
               <Input
                 label="WhatsApp Number *"
                 name="whatsapp_number"
                 value={formData.whatsapp_number}
                 onChange={handleChange}
                 required
               />
             ) : (
               <Input
                 label="Phone Number *"
                 name="contact_number"
                 value={formData.contact_number}
                 onChange={handleChange}
                 required
               />
             )}
           </div>
            <Input
              label="Website URL (Optional)"
              name="website_url"
              value={formData.website_url}
              onChange={handleChange}
              type="url"
            />
            <Input
              label="Instagram Handle or ID (Optional)"
              name="instagram_handle"
              value={formData.instagram_handle}
              onChange={handleChange}
              placeholder="e.g. yourusername"
            />
            {formData.provider_type !== 'freelancer' && (
              <Input
                label="Google Map Embed Code or URL (Optional)"
                name="map_embed_url"
                value={formData.map_embed_url}
                onChange={handleChange}
                placeholder="e.g. https://maps.google.com/maps?q=... or full iframe tag"
              />
            )}
        </div>



        {error && <div className={styles.errorMobile}>{error}</div>}

        <div className={styles.actions}>
          {initialData?.status === 'approved' ? (
            <Button 
              type="button" 
              onClick={(e) => handleSubmit(e, 'approved')}
              loading={loading}
              style={{ minWidth: '160px' }}
            >
              Save Changes
            </Button>
          ) : (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={(e) => handleSubmit(e, 'draft')}
                loading={loading}
              >
                Save as Draft
              </Button>
              <Button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'pending_approval')}
                loading={loading}
              >
                {isEdit ? 'Update & Submit' : 'Submit for Approval'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Card>
  );
}
