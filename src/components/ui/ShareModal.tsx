"use client";

import React, { useState, useEffect } from "react";
import styles from "./ShareModal.module.css";
import { X, Share2, Copy, Check } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  avatarUrl: string;
  metaText: string;
  shareUrl?: string; // Optional: fallback resolves to window.location.href on mount
  customText?: string; // Optional: custom message text for share links
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  avatarUrl,
  metaText,
  shareUrl,
  customText,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [instaHelperActive, setInstaHelperActive] = useState(false);
  const [isMobileShareSupported, setIsMobileShareSupported] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const resolvedUrl = shareUrl || window.location.href;
      setCurrentUrl(resolvedUrl);
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        setIsMobileShareSupported(true);
      }
    }
  }, [shareUrl]);

  if (!isOpen) return null;

  const defaultShareText = customText || `Check out ${title} on Graphitex Digitals!`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(defaultShareText + " " + currentUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(defaultShareText)}&url=${encodeURIComponent(currentUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstagramShare = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setInstaHelperActive(true);
    setTimeout(() => setCopied(false), 2000);
    setTimeout(() => setInstaHelperActive(false), 5000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: title,
          text: defaultShareText,
          url: currentUrl,
        });
      } catch (err) {
        console.warn("Error native sharing:", err);
      }
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Share Profile</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Mini Profile Card */}
        <div className={styles.shareProfileMiniCard}>
          <div className={styles.shareProfileMiniAvatarContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl || "/placeholder-avatar.svg"}
              alt={title}
              className={styles.shareProfileMiniAvatar}
              loading="lazy"
            />
          </div>
          <div className={styles.shareProfileMiniInfo}>
            <h4 className={styles.shareProfileMiniName}>{title}</h4>
            <div className={styles.shareProfileMiniMeta}>
              <span>{metaText}</span>
            </div>
          </div>
        </div>

        {/* Share Grid */}
        <div className={styles.shareOptionsGrid}>
          {/* WhatsApp */}
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.shareOptionItem}>
            <div className={`${styles.shareIconCircle} ${styles.shareIconWhatsapp}`}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.63 1.97 14.155.945 11.533.945c-5.445 0-9.87 4.373-9.874 9.802-.002 2.03.535 4.022 1.558 5.769l-.99 3.613 3.738-.975zM17.476 14.39c-.326-.162-1.93-.941-2.228-1.05-.297-.108-.513-.162-.73.162-.216.324-.838 1.05-1.027 1.267-.19.216-.379.243-.705.082-.326-.162-1.378-.504-2.625-1.608-.971-.859-1.626-1.92-1.816-2.244-.19-.324-.02-.5-.18-.661-.147-.145-.326-.379-.489-.569-.163-.19-.217-.324-.326-.541-.108-.216-.054-.405-.027-.568.027-.162.216-.513.326-.757.108-.243.162-.405.243-.567.081-.162.04-.324-.013-.486-.054-.162-.513-1.217-.703-1.67-.185-.443-.37-.383-.513-.39-.13-.006-.282-.008-.431-.008-.149 0-.39.054-.595.27-.205.216-.784.757-.784 1.84 0 1.08.795 2.124.903 2.27.108.147 1.564 2.358 3.79 3.298.53.223.943.356 1.265.457.532.167 1.017.143 1.399.088.427-.062 1.93-.778 2.2-1.49.27-.711.27-1.32.19-1.446-.081-.127-.297-.205-.623-.368z"/>
              </svg>
            </div>
            <span className={styles.shareOptionText}>WhatsApp</span>
          </a>

          {/* Instagram Story / Reels */}
          <div onClick={handleInstagramShare} className={styles.shareOptionItem}>
            <div className={`${styles.shareIconCircle} ${styles.shareIconInstagram}`}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </div>
            <span className={styles.shareOptionText}>Insta / Reels</span>
          </div>

          {/* Facebook */}
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className={styles.shareOptionItem}>
            <div className={`${styles.shareIconCircle} ${styles.shareIconFacebook}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </div>
            <span className={styles.shareOptionText}>Facebook</span>
          </a>

          {/* Twitter / X */}
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className={styles.shareOptionItem}>
            <div className={`${styles.shareIconCircle} ${styles.shareIconTwitter}`}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <span className={styles.shareOptionText}>Twitter / X</span>
          </a>
        </div>

        {/* Link Copy Box */}
        <div className={styles.shareLinkBox}>
          <input
            type="text"
            readOnly
            value={currentUrl}
            className={styles.shareLinkInput}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button className={styles.shareLinkCopyBtn} onClick={handleCopyLink}>
            {copied ? <Check size={16} className={styles.copyCheckIcon} /> : <Copy size={16} />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>

        {/* Custom Helper Message */}
        {instaHelperActive && (
          <div className={styles.shareToast}>
            ✓ Link copied! You can now paste it into your Instagram stories, bio, feed posts, or reels descriptions.
          </div>
        )}

        {/* Mobile Native Share Trigger */}
        {isMobileShareSupported && (
          <button className={styles.nativeShareBtn} onClick={handleNativeShare}>
            <Share2 size={16} />
            <span>More Share Options</span>
          </button>
        )}
      </div>
    </div>
  );
}
