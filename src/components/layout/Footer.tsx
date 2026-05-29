"use client";

import React from "react";
import Link from "next/link";
import styles from "./Footer.module.css";
import Logo from "./Logo";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerGrid}`}>
        {/* Brand Column */}
        <div className={styles.brandCol}>
          <div className={styles.logoRow}>
            <Logo height={28} />
          </div>
          <p className={styles.tagline}>
            India's creative marketplace connecting creators, service providers, and local businesses under a unified ecosystem.
          </p>
          <div className={styles.socials}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
            <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Explore Links Column */}
        <div className={styles.linksCol}>
          <h4 className={styles.colTitle}>Explore</h4>
          <ul className={styles.linksList}>
            <li>
              <Link href="/services">Services Directory</Link>
            </li>
            <li>
              <Link href="/influencers">Influencers Directory</Link>
            </li>
            <li>
              <Link href="/opportunities">Campaigns & Gigs</Link>
            </li>
          </ul>
        </div>

        {/* Support & Legal Links Column */}
        <div className={styles.linksCol}>
          <h4 className={styles.colTitle}>Support & Legal</h4>
          <ul className={styles.linksList}>
            <li>
              <Link href="/login">Join the Marketplace</Link>
            </li>
            <li>
              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer">Contact Support</a>
            </li>
            <li>
              <span className={styles.inactiveLink}>Terms of Service</span>
            </li>
            <li>
              <span className={styles.inactiveLink}>Privacy Policy</span>
            </li>
          </ul>
        </div>

        {/* Contact/Info Column */}
        <div className={styles.linksCol}>
          <h4 className={styles.colTitle}>Contact Information</h4>
          <ul className={styles.contactList}>
            <li>
              <Phone size={14} className={styles.contactIcon} />
              <span>+91 99999 99999</span>
            </li>
            <li>
              <Mail size={14} className={styles.contactIcon} />
              <span>hello@graphitex.app</span>
            </li>
            <li>
              <MapPin size={14} className={styles.contactIcon} />
              <span>Serving Mangalore</span>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomBarInner}`}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Graphitex Digitals. All rights reserved.
          </p>
          <p className={styles.tag}>
            Made with ❤️ for Indian Creators & Brands
          </p>
        </div>
      </div>
    </footer>
  );
}
