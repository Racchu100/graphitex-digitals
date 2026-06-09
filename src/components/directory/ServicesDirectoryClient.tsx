"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import styles from "@/app/(public)/services/page.module.css";
import BusinessCard from "./BusinessCard";
import { createClient } from "@/lib/supabase/client";

const MANGALORE_LOCALITIES = [
  "Attavar",
  "Bejai",
  "Bolar",
  "Car Street",
  "Derlakatte",
  "Gujjarakere",
  "Hampankatta",
  "Jeppu",
  "Kadri",
  "Kavoor",
  "Kulshekar",
  "Lalbagh",
  "Mannagudda",
  "Padil",
  "Pandeshwar",
  "Shaktinagar",
  "Surathkal",
  "Urwa",
  "Valachil",
  "Yeyyadi"
];

interface ServicesDirectoryClientProps {
  initialProfiles: any[];
  isDemoMode: boolean;
  categoryMetadata: Record<string, { desc: string; id: string }>;
}

export default function ServicesDirectoryClient({
  initialProfiles,
  isDemoMode,
  categoryMetadata
}: ServicesDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const locationRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();

  // Sync category, search keyword, and location queries from URL search parameters
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    const qParam = searchParams.get("q");
    if (qParam) {
      setSearchQuery(qParam);
    }
    const locParam = searchParams.get("location");
    if (locParam) {
      setLocationQuery(locParam);
    }
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadLocations() {
      try {
        const supabase = createClient();
        
        // Fetch cities
        const { data: citiesData } = await supabase
          .from("cities")
          .select("name")
          .order("name");
          
        // Fetch states
        const { data: statesData } = await supabase
          .from("states")
          .select("name")
          .order("name");

        const cityNames = (citiesData || []).map((c: any) => c.name);
        const stateNames = (statesData || []).map((s: any) => s.name);
        
        const combined = Array.from(new Set([
          ...cityNames,
          ...stateNames,
          ...MANGALORE_LOCALITIES
        ])).sort();
        
        setLocations(combined);
      } catch (err) {
        console.warn("Failed to fetch locations from DB, falling back to static list:", err);
        const staticCombined = Array.from(new Set([
          "Bengaluru", "Mangaluru", "Mangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi", "Manipal", "Udupi", "Goa",
          "Karnataka", "Maharashtra", "Telangana", "Tamil Nadu", "West Bengal", "Gujarat", "Rajasthan", "Kerala",
          ...MANGALORE_LOCALITIES
        ])).sort();
        setLocations(staticCombined);
      }
    }
    
    loadLocations();
  }, []);

  const filteredLocalities = React.useMemo(() => {
    const trimmed = locationQuery.toLowerCase().trim();
    if (!trimmed) {
      return [
        "Mangalore", "Bengaluru", "Udupi", "Manipal", "Mumbai", "Delhi",
        ...MANGALORE_LOCALITIES.slice(0, 8)
      ];
    }
    return locations.filter(loc => 
      loc.toLowerCase().includes(trimmed)
    );
  }, [locationQuery, locations]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [locationQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setShowDropdown(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1) % filteredLocalities.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex(prev => (prev - 1 + filteredLocalities.length) % filteredLocalities.length);
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && focusedIndex < filteredLocalities.length) {
        e.preventDefault();
        const selectedLoc = filteredLocalities[focusedIndex];
        setLocationQuery(selectedLoc);
        setShowDropdown(false);
        setFocusedIndex(-1);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setFocusedIndex(-1);
    }
  };

  // Get unique categories and counts based only on general search and location query
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    initialProfiles.forEach((profile: any) => {
      // 1. General search filter
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const nameMatches = profile.business_name?.toLowerCase().includes(query);
        const taglineMatches = profile.tagline?.toLowerCase().includes(query);
        const categoryMatches = profile.categories?.name?.toLowerCase().includes(query);
        const cityMatches = profile.cities?.name?.toLowerCase().includes(query);
        const stateMatches = profile.states?.name?.toLowerCase().includes(query);
        const addressMatches = profile.address_line?.toLowerCase().includes(query);
        const descriptionMatches = profile.description?.toLowerCase().includes(query);

        if (!(nameMatches || taglineMatches || categoryMatches || cityMatches || stateMatches || addressMatches || descriptionMatches)) {
          return;
        }
      }

      // 2. Specific Location filter
      const locQuery = locationQuery.toLowerCase().trim();
      if (locQuery) {
        const cityMatches = profile.cities?.name?.toLowerCase().includes(locQuery);
        const stateMatches = profile.states?.name?.toLowerCase().includes(locQuery);
        const addressMatches = profile.address_line?.toLowerCase().includes(locQuery);

        if (!(cityMatches || stateMatches || addressMatches)) {
          return;
        }
      }

      const catName = profile.categories?.name || "Other Services";
      counts[catName] = (counts[catName] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));
  }, [initialProfiles, searchQuery, locationQuery]);

  // Live filter profiles based on search query, location query, and selected category
  const filteredProfiles = initialProfiles.filter((profile: any) => {
    // 1. General Search query filter
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const nameMatches = profile.business_name?.toLowerCase().includes(query);
      const taglineMatches = profile.tagline?.toLowerCase().includes(query);
      const categoryMatches = profile.categories?.name?.toLowerCase().includes(query);
      const cityMatches = profile.cities?.name?.toLowerCase().includes(query);
      const stateMatches = profile.states?.name?.toLowerCase().includes(query);
      const addressMatches = profile.address_line?.toLowerCase().includes(query);
      const descriptionMatches = profile.description?.toLowerCase().includes(query);

      if (!(nameMatches || taglineMatches || categoryMatches || cityMatches || stateMatches || addressMatches || descriptionMatches)) {
        return false;
      }
    }

    // 2. Specific Location search query filter
    const locQuery = locationQuery.toLowerCase().trim();
    if (locQuery) {
      const cityMatches = profile.cities?.name?.toLowerCase().includes(locQuery);
      const stateMatches = profile.states?.name?.toLowerCase().includes(locQuery);
      const addressMatches = profile.address_line?.toLowerCase().includes(locQuery);

      if (!(cityMatches || stateMatches || addressMatches)) {
        return false;
      }
    }

    // 3. Category selection filter
    if (selectedCategory) {
      const catName = profile.categories?.name || "Other Services";
      if (catName !== selectedCategory) {
        return false;
      }
    }

    return true;
  });

  // Extract unique category names from the final filtered profiles
  const uniqueCategoryNames = Array.from(
    new Set(filteredProfiles.map((p: any) => p.categories?.name || "Other Services"))
  );

  // Group filtered profiles into styled categories and sort by views_count descending
  const activeCategories = uniqueCategoryNames.map(catName => {
    const metadata = categoryMetadata[catName] || {
      desc: `High-quality vetted services registered in the ${catName} segment.`,
      id: catName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    };
    return {
      name: catName,
      desc: metadata.desc,
      id: metadata.id,
      profiles: filteredProfiles
        .filter((p: any) => (p.categories?.name || "Other Services") === catName)
        .sort((a, b) => Number(b.views_count || 0) - Number(a.views_count || 0))
    };
  });

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Business Directory</h1>
        <p className={styles.subtitle}>
          Discover trusted creative businesses and service providers. 
          {isDemoMode && <span style={{ color: "var(--color-primary)", fontWeight: "bold", marginLeft: "8px" }}>(Vetted Demo Listings)</span>}
        </p>

        {/* Premium Instant Search Bar */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search services, taglines, categories, or locations (e.g. ad shoots, Bengaluru)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className={styles.clearButton}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <div className={styles.searchResultsCount}>
            Showing {filteredProfiles.length} of {initialProfiles.length} listings
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sticky Filters Menu */}
        <aside className={styles.sidebar}>
          {/* Location Search Box (Above Explore Domains) */}
          <div className={styles.filterCard} style={{ marginBottom: '8px' }} ref={locationRef}>
            <h3 className={styles.filterTitle} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>📍</span> Location
            </h3>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="City or area (e.g. Bolar, Kadri)..."
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                style={{
                  width: '100%',
                  padding: 'var(--sidebar-padding-input, 6px 8px)',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--sidebar-font-size-input, 13px)',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
              />
              {locationQuery && (
                <button
                  onClick={() => {
                    setLocationQuery("");
                    setShowDropdown(false);
                  }}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: 'var(--sidebar-font-size-btn, 11px)',
                    padding: 0
                  }}
                  title="Clear location"
                >
                  ✕
                </button>
              )}

              {/* Floating Dropdown List of Mangalore locations */}
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 200,
                  marginTop: '4px',
                  background: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md, 8px)',
                  boxShadow: 'var(--shadow-md, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
                  maxHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {filteredLocalities.length === 0 ? (
                    <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      No matching areas found
                    </div>
                  ) : (
                    filteredLocalities.map((loc, index) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setLocationQuery(loc);
                          setShowDropdown(false);
                          setFocusedIndex(-1);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          background: index === focusedIndex ? 'hsla(262, 83%, 58%, 0.08)' : 'none',
                          border: 'none',
                          borderLeft: index === focusedIndex ? '3px solid var(--color-primary, hsl(262, 70%, 45%))' : '3px solid transparent',
                          padding: '8px 12px 8px 9px',
                          color: index === focusedIndex ? 'var(--color-primary, hsl(262, 70%, 45%))' : 'var(--color-text-primary)',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={() => setFocusedIndex(index)}
                        onMouseLeave={() => setFocusedIndex(-1)}
                      >
                        📍 {loc}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Explore Domains with Interactive Selection */}
          <div className={styles.filterCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 className={styles.filterTitle} style={{ margin: 0 }}>Domains</h3>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontSize: 'var(--sidebar-font-size-btn, 11px)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {categoryCounts.length === 0 ? (
              <p className={styles.filterNote}>No categories matching query</p>
            ) : (
              <ul className={styles.categoryLinks} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sidebar-gap-links, 8px)' }}>
                {categoryCounts.map(cat => {
                  const isSelected = selectedCategory === cat.name;
                  return (
                    <li key={cat.name}>
                      <button
                        onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          textAlign: 'left',
                          background: isSelected ? 'hsla(262, 83%, 58%, 0.1)' : 'transparent',
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                          border: isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
                          padding: 'var(--sidebar-padding-item, 8px 12px)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: isSelected ? '600' : 'normal',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <span style={{ fontSize: 'var(--sidebar-font-size-item, 13px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{cat.name}</span>
                        <span style={{ 
                          fontSize: 'var(--sidebar-font-size-badge, 11px)', 
                          background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-elevated)', 
                          color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                          padding: 'var(--sidebar-padding-badge, 2px 6px)',
                          borderRadius: '8px',
                          fontWeight: '600',
                          border: '1px solid var(--color-border)',
                          minWidth: '14px',
                          textAlign: 'center',
                          flexShrink: 0
                        }}>
                          {cat.count}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Separated visual grids per business domain */}
        <main className={styles.main}>
          {selectedCategory && (
            <button 
              onClick={() => setSelectedCategory(null)}
              className={styles.backToAllBtn}
            >
              ← Show All Categories
            </button>
          )}
          {activeCategories.length === 0 ? (
            <div className={styles.emptyState}>
              <h2>No matching services found</h2>
              <p>Try refining your search keyword or location filter.</p>
            </div>
          ) : (
            activeCategories.map(cat => (
              <section key={cat.id} id={cat.id} className={styles.categorySection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{cat.name}</h2>
                  <p className={cat.desc ? styles.sectionDesc : ""}>{cat.desc}</p>
                </div>
                <div className={`${styles.grid} ${!selectedCategory ? styles.limitShowcase : ""}`}>
                  {cat.profiles.map((profile: any) => (
                    <BusinessCard key={profile.id} profile={profile} />
                  ))}
                </div>
                {!selectedCategory && (
                  <div className={`${styles.viewAllContainer} ${cat.profiles.length > 2 ? styles.hasMoreThan2 : ""} ${cat.profiles.length > 3 ? styles.hasMoreThan3 : ""}`}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={styles.viewAllBtn}
                    >
                      View All {cat.name} ({cat.profiles.length}) →
                    </button>
                  </div>
                )}
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
