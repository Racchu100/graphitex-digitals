"use client";
import React, { useState, useEffect } from "react";
import styles from "./OpportunitiesDirectoryClient.module.css";
import OpportunityCard from "./OpportunityCard";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";

interface OpportunitiesDirectoryClientProps {
  initialOpps: any[];
  isDemoMode: boolean;
}

export default function OpportunitiesDirectoryClient({
  initialOpps,
  isDemoMode
}: OpportunitiesDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [prioritySort, setPrioritySort] = useState<"default" | "recent" | "pay">("default");
  const [followerTier, setFollowerTier] = useState<"all" | "nano" | "micro" | "macro" | "mega">("all");
  const [minPaySlider, setMinPaySlider] = useState<number>(0);

  const supabase = createClient();
  const { user, roles, loading } = useUser();
  const [appliedOpportunityIds, setAppliedOpportunityIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (loading || !user) return;
    const isInfluencer = Array.isArray(roles) && roles.some(r => r?.role === 'influencer');
    if (!isInfluencer) return;

    async function fetchApplied() {
      try {
        const { data: ip } = await supabase
          .from('influencer_profiles')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (ip) {
          const { data } = await supabase
            .from('opportunity_applications')
            .select('opportunity_id')
            .eq('influencer_profile_id', ip.id);

          if (data) {
            setAppliedOpportunityIds(new Set(data.map((app: any) => app.opportunity_id)));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch applied opportunities:", err);
      }
    }

    fetchApplied();
  }, [user, roles, loading, supabase]);

  // Find maximum potential payout across all initial opportunities dynamically
  const maxPayout = React.useMemo(() => {
    if (initialOpps.length === 0) return 100000;
    return Math.max(...initialOpps.map((o) => o.price_max || 0), 100000);
  }, [initialOpps]);

  // Dynamically extract unique categories from initial opportunities
  const uniqueCategories = React.useMemo(() => {
    const list = initialOpps
      .map((o) => o.business_profiles?.categories?.name)
      .filter(Boolean);
    return Array.from(new Set(list)) as string[];
  }, [initialOpps]);

  // Sort categories placing Fashion, Food, and Gadgets at the very top
  const sortedCategories = React.useMemo(() => {
    const primaryKeywords = ["fashion", "food", "gadget", "tech", "lifestyle", "clothing", "travel"];
    const primary: string[] = [];
    const secondary: string[] = [];

    uniqueCategories.forEach((cat) => {
      const low = cat.toLowerCase();
      const isPrimary = primaryKeywords.some((keyword) => low.includes(keyword));
      if (isPrimary) {
        primary.push(cat);
      } else {
        secondary.push(cat);
      }
    });

    primary.sort((a, b) => {
      const lowA = a.toLowerCase();
      const lowB = b.toLowerCase();

      const getPriority = (str: string) => {
        if (str.includes("fashion") || str.includes("clothing") || str.includes("lifestyle")) return 1;
        if (str.includes("food")) return 2;
        if (str.includes("gadget") || str.includes("tech")) return 3;
        if (str.includes("travel") || str.includes("tourism")) return 4;
        return 5;
      };

      return getPriority(lowA) - getPriority(lowB);
    });

    secondary.sort();

    return [...primary, ...secondary];
  }, [uniqueCategories]);

  // Get matching opportunity count for each category
  const getCategoryCount = (category: string) => {
    return initialOpps.filter((o) => o.business_profiles?.categories?.name === category).length;
  };

  // Live filter opportunities based on search queries and sidebar selectors
  const filteredOpps = initialOpps.filter((opp: any) => {
    // 1. Search keyword lookup
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const titleMatches = opp.title?.toLowerCase().includes(query);
      const purposeMatches = opp.purpose?.toLowerCase().includes(query);
      const brandMatches = opp.business_profiles?.business_name?.toLowerCase().includes(query);
      const platformMatches = opp.platform_preference?.toLowerCase().includes(query);
      const descriptionMatches = opp.description?.toLowerCase().includes(query);
      if (!titleMatches && !purposeMatches && !brandMatches && !platformMatches && !descriptionMatches) {
        return false;
      }
    }

    // 2. Sidebar category filter
    if (selectedCategory) {
      const oppCategory = opp.business_profiles?.categories?.name;
      if (oppCategory !== selectedCategory) {
        return false;
      }
    }

    // 3. Price slider range filter (payout capacity)
    if (minPaySlider > 0) {
      if (opp.price_max < minPaySlider) {
        return false;
      }
    }

    // 4. Followers requirements filter
    if (followerTier !== "all") {
      const reqFollowers = opp.min_followers || 0;
      if (followerTier === "nano" && reqFollowers > 10000) return false;
      if (followerTier === "micro" && reqFollowers > 50000) return false;
      if (followerTier === "macro" && reqFollowers > 100000) return false;
      if (followerTier === "mega" && reqFollowers <= 100000) return false;
    }

    return true;
  });

  // Sort opportunities based on prioritySort criteria
  const sortedOpps = [...filteredOpps].sort((a, b) => {
    if (prioritySort === "recent") {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }
    if (prioritySort === "pay") {
      return (b.price_max || 0) - (a.price_max || 0);
    }
    return 0;
  });

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Opportunities</h1>
        <p className={styles.subtitle}>
          Find recruitment ads posted by brands and service providers.
          {isDemoMode && <span style={{ color: "var(--color-primary)", fontWeight: "bold", marginLeft: "8px" }}>(Vetted Demo Listings)</span>}
        </p>

        {/* Premium Instant Search Bar */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search campaigns, products, brands, or platforms (e.g. video, Elysian, instagram)..."
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
            Showing {sortedOpps.length} of {initialOpps.length} active opportunities
          </div>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.filterCard}>
            
            {/* Section 1: Priority Sort */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionTitle}>
                🎯 Priority Sort
              </h4>
              <div className={styles.sortOptions}>
                <div 
                  className={`${styles.sortOption} ${prioritySort === "default" ? styles.sortOptionActive : ""}`}
                  onClick={() => setPrioritySort("default")}
                >
                  ✨ Default Order
                </div>
                <div 
                  className={`${styles.sortOption} ${prioritySort === "recent" ? styles.sortOptionActive : ""}`}
                  onClick={() => setPrioritySort("recent")}
                >
                  📅 Recently Uploaded
                </div>
                <div 
                  className={`${styles.sortOption} ${prioritySort === "pay" ? styles.sortOptionActive : ""}`}
                  onClick={() => setPrioritySort("pay")}
                >
                  💰 Highest Budget
                </div>
              </div>
            </div>

            {/* Slider Price range */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionTitle}>
                💸 Payout (Pay Range)
              </h4>
              <div className={styles.sliderContainer}>
                <div className={styles.sliderLabelRow}>
                  <span className={styles.sliderSubLabel}>Min Payout:</span>
                  <span className={styles.sliderValueText}>
                    INR {minPaySlider === 0 ? "Any" : minPaySlider.toLocaleString("en-US") + "+"}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxPayout}
                  step="1000"
                  value={minPaySlider}
                  onChange={(e) => setMinPaySlider(parseInt(e.target.value))}
                  className={styles.rangeInput}
                />
                <span className={styles.sliderInfoText}>
                  Slide to filter opportunities paying up to {maxPayout.toLocaleString("en-US")} INR
                </span>
              </div>
            </div>

            {/* Follower eligibility tier list */}
            <div className={styles.filterSection}>
              <h4 className={styles.filterSectionTitle}>
                👥 Required Followers
              </h4>
              <div className={styles.tierList}>
                <div 
                  className={`${styles.tierItem} ${followerTier === "all" ? styles.tierItemActive : ""}`}
                  onClick={() => setFollowerTier("all")}
                >
                  Any
                </div>
                <div 
                  className={`${styles.tierItem} ${followerTier === "nano" ? styles.tierItemActive : ""}`}
                  onClick={() => setFollowerTier("nano")}
                >
                  ≤ 10K (Nano)
                </div>
                <div 
                  className={`${styles.tierItem} ${followerTier === "micro" ? styles.tierItemActive : ""}`}
                  onClick={() => setFollowerTier("micro")}
                >
                  ≤ 50K (Micro)
                </div>
                <div 
                  className={`${styles.tierItem} ${followerTier === "macro" ? styles.tierItemActive : ""}`}
                  onClick={() => setFollowerTier("macro")}
                >
                  ≤ 100K (Macro)
                </div>
                <div 
                  className={`${styles.tierItem} ${followerTier === "mega" ? styles.tierItemActive : ""}`}
                  onClick={() => setFollowerTier("mega")}
                >
                  &gt; 100K (Mega)
                </div>
              </div>
            </div>

            {/* Section 2: Niche Categories */}
            <div className={styles.filterSection}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                <h4 className={styles.filterSectionTitle} style={{ margin: 0 }}>
                  🏷️ Niche Categories
                </h4>
                {selectedCategory && (
                  <button 
                    className={styles.clearFilterBtn}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className={styles.filterList}>
                {sortedCategories.map((category) => {
                  const isActive = selectedCategory === category;
                  const count = getCategoryCount(category);

                  return (
                    <div 
                      key={category}
                      className={`${styles.filterItem} ${isActive ? styles.filterItemActive : ""}`}
                      onClick={() => setSelectedCategory(isActive ? null : category)}
                    >
                      <span>{category}</span>
                      <span className={styles.filterBadge}>{count}</span>
                    </div>
                  );
                })}
                {sortedCategories.length === 0 && (
                  <p style={{ fontSize: "11px", color: "var(--color-text-muted)", margin: "var(--space-2) 0" }}>
                    No categories found.
                  </p>
                )}
              </div>
            </div>

          </div>
        </aside>

        {/* Main list */}
        <main className={styles.main}>
          {sortedOpps.length === 0 ? (
            <div className={styles.emptyState}>
              <h2>No matching opportunities found</h2>
              <p>Try refining your search keyword, sliders, or filters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {sortedOpps.map((opp: any) => (
                <OpportunityCard 
                  key={opp.id} 
                  opportunity={opp} 
                  hasApplied={appliedOpportunityIds.has(opp.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
