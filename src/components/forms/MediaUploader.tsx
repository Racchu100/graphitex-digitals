"use client";

import React, { useState, useCallback, useEffect } from "react";
import styles from "./MediaUploader.module.css";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Upload, X, GripVertical } from "lucide-react";
import { BusinessMedia } from "@/types/database";
import { getInfluencerSlug } from "@/lib/utils/slug";
import { compressImageToWebP } from "@/lib/utils/imageCompressor";

interface MediaUploaderProps {
  profileId: string;
  businessName?: string;
}

export default function MediaUploader({ profileId, businessName }: MediaUploaderProps) {
  const supabase = createClient();
  const [media, setMedia] = useState<BusinessMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const fetchMedia = useCallback(async () => {
    const { data, error } = await supabase
      .from('business_media')
      .select('*')
      .eq('business_profile_id', profileId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error("Error fetching media:", error);
    } else if (data) {
      setMedia(data as BusinessMedia[]);
    }
  }, [profileId, supabase]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const currentImagesCount = media.filter(m => m.media_type === "image").length;
      const currentVideosCount = media.filter(m => m.media_type === "video").length;

      let imagesToBeAdded = 0;
      let videosToBeAdded = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (isImage) imagesToBeAdded++;
        if (isVideo) videosToBeAdded++;
      }


      if (currentVideosCount + videosToBeAdded > 2) {
        alert("You can upload a maximum of 2 videos.");
        throw new Error("You can upload a maximum of 2 videos.");
      }

      for (let i = 0; i < files.length; i++) {
        const rawFile = files[i];
        const isImage = rawFile.type.startsWith('image/');
        const isVideo = rawFile.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          throw new Error("Only images and videos are supported.");
        }

        const file = await compressImageToWebP(rawFile);

        if (isImage && file.size > 10 * 1024 * 1024) throw new Error("Image exceeds 10MB limit.");
        if (isVideo && file.size > 100 * 1024 * 1024) throw new Error("Video exceeds 100MB limit.");

        const fileExt = file.type.startsWith("image/") ? "webp" : (file.name.split('.').pop() || "png");
        const businessSlug = businessName ? getInfluencerSlug(businessName) : profileId;
        const fileName = `services/${businessSlug}/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

        // Upload using secure API route
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("bucket", "business-media");
        uploadData.append("path", fileName);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload media.");
        }

        const { url: publicUrl } = await response.json();

        // Insert into DB
        const { error: dbError } = await supabase
          .from('business_media')
          .insert({
            business_profile_id: profileId,
            media_type: isImage ? 'image' : 'video',
            url: publicUrl,
            sort_order: media.length + i,
          });

        if (dbError) throw dbError;
      }
      
      await fetchMedia();
    } catch (err: any) {
      setError(err.message || "Failed to upload media.");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number, url: string) => {
    try {
      // 1. Delete from DB
      const { error: dbError } = await supabase
        .from('business_media')
        .delete()
        .eq('id', id);
        
      if (dbError) throw dbError;

      // 2. Extract path and delete from Storage
      // URL format: .../storage/v1/object/public/business-media/profileId/filename.ext
      const urlParts = url.split('/business-media/');
      if (urlParts.length > 1) {
        const path = urlParts[1];
        await supabase.storage.from('business-media').remove([path]);
      }

      setMedia(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setError("Failed to delete media.");
      console.error(err);
    }
  };

  // The first image is treated as the service thumbnail/profile image and should not be shown in the media gallery
  const thumbnailItem = media.find(m => m.media_type === "image");
  const galleryMedia = media.filter(m => m.id !== thumbnailItem?.id);

  return (
    <div className={styles.container}>
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.uploadArea}>
        <input 
          type="file" 
          id="media-upload" 
          multiple 
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          onChange={handleFileUpload}
          disabled={uploading}
          className={styles.fileInput}
        />
        <label htmlFor="media-upload" className={styles.uploadLabel}>
          <Upload size={24} />
          <span>{uploading ? 'Uploading...' : 'Click to upload or drag & drop'}</span>
          <small>Upload unlimited images and up to 2 videos. (Images: max 10MB, Videos: max 100MB)</small>
        </label>
      </div>

      {galleryMedia.length > 0 && (
        <div className={styles.grid}>
          {galleryMedia.map((item) => (
            <div key={item.id} className={styles.mediaCard}>
              <div className={styles.dragHandle}>
                <GripVertical size={16} />
              </div>
              
              <button 
                className={styles.deleteBtn} 
                onClick={() => handleDelete(item.id, item.url)}
                aria-label="Delete media"
              >
                <X size={16} />
              </button>

              {item.media_type === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="Business Media" className={styles.mediaItem} />
              ) : (
                <video src={item.url} className={styles.mediaItem} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
