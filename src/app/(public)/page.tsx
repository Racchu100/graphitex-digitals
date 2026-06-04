"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "@/components/ui/Button";
import Logo from "@/components/layout/Logo";
import {
  Search,
  MapPin,
  ArrowRight,
  Paintbrush,
  Camera,
  TrendingUp,
  Code,
  Users,
  Star,
  CheckCircle,
  Send,
  Zap,
  Shield,
  Eye,
  Phone,
  Shirt,
  Laptop,
  Home,
  Plane,
  Utensils,
  Dumbbell,
  BookOpen,
  Car,
  Gem,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── CATEGORY DATA ──────────────────────────────────────────────────────────────
const categories = [
  {
    label: "Photography & Video",
    slug: "Photography & Video",
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Fashion & Clothing",
    slug: "Fashion & Clothing",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Technology & Gadgets",
    slug: "Technology & Gadgets",
    image: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Home & Interior",
    slug: "Home & Interior",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Travel & Tourism",
    slug: "Travel & Tourism",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Food & Restaurants",
    slug: "Food & Restaurants",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Fitness & Gym",
    slug: "Fitness & Gym",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Education & Coaching",
    slug: "Education & Coaching",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Automotive",
    slug: "Automotive",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Jewellery & Accessories",
    slug: "Jewellery & Accessories",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Beauty & Wellness",
    slug: "Beauty & Wellness",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Real Estate",
    slug: "Real Estate",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Events & Entertainment",
    slug: "Events & Entertainment",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Finance & Insurance",
    slug: "Finance & Insurance",
    image: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Pet Care",
    slug: "Pet Care",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=400&q=80"
  },
  {
    label: "Agriculture & Farming",
    slug: "Agriculture & Farming",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=400&q=80"
  }
];



// ── POPULAR CATEGORIES ───────────────────────────────────────────────────────────
const popularCategories = [
  "Fashion & Clothing",
  "Jewellery & Accessories",
  "Food & Restaurants",
  "Technology & Gadgets",
  "Photography & Video"
];

const heroCarouselSlides = [
  {
    title: "Graphitex Digitals Creative Agency Services",
    subtitle: "Graphic Design • Website Development • Ad Shoots • Instagram Page Handling • Digital Marketing",
    desc: "Scale your business organic traffic, creative reach, and conversions with our comprehensive, premium digital solutions.",
    image: "/agency_services_banner.webp",
    ctaText: "Explore Agency Services 🚀",
    actionType: "scroll",
    target: "services-agency"
  },
  {
    title: "Local Business & Services Directory",
    subtitle: "Hyper-Local Search • Mangalore Focus • Verified Listings",
    desc: "Search, filter, and discover trusted local agencies, professionals, and freelancers nearby. Connect directly via WhatsApp with zero middlemen.",
    image: "/business_directory_banner.webp",
    ctaText: "Search Business Directory 🔍",
    actionType: "link",
    target: "/services"
  },
  {
    title: "Direct Business & Creator Collaborations",
    subtitle: "Influencer Campaigns • Budget Matching • Verified Creator Base",
    desc: "Brand owners can search and directly pitch to creators or accept applications matching their campaign budgets with total pricing transparency.",
    image: "/influencer_collaboration_banner.webp",
    ctaText: "Find Creators & Influencers 📣",
    actionType: "link",
    target: "/influencers"
  }
];

// ── HERO HEADLINE ROTATIONS ────────────────────────────────────────────────────
const heroHeadlines = [
  "Grow Your Business with Us",
  "Find Top Creators for Your Brand",
  "Discover Local Businesses Near You",
  "Connect with Verified Influencers",
];



export default function HomePage() {
  const router = useRouter();

  // Search state
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchLocation, setSearchLocation] = useState("Mangalore");

  // Hero headline rotation
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [headlineFading, setHeadlineFading] = useState(false);

  // Landscape carousel state
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-play the landscape hero carousel
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroCarouselSlides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  // WhatsApp form
  const [userName, setUserName] = useState("");
  const [selectedService, setSelectedService] = useState("Graphic Designing");
  const [customMessage, setCustomMessage] = useState(
    'Hi Graphitex, I would like to enquire about your "Graphic Designing" service. Let\'s discuss this!'
  );

  // Hero headline rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineFading(true);
      setTimeout(() => {
        setHeadlineIndex((prev) => (prev + 1) % heroHeadlines.length);
        setHeadlineFading(false);
      }, 350);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword) params.set("q", searchKeyword);
    if (searchLocation && searchLocation !== "Mangalore") params.set("location", searchLocation);
    router.push(`/services?${params.toString()}`);
  };

  // Service change
  const handleServiceChange = (service: string) => {
    setSelectedService(service);
    setCustomMessage(`Hi Graphitex, I would like to enquire about your "${service}" service. Let's discuss this!`);
  };

  const handleEnquireClick = (service: string) => {
    handleServiceChange(service);
    document.getElementById("whatsapp-enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleWhatsAppSend = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = userName.trim() || "Client";
    const cleanMessage = customMessage.trim() || `I need a service in ${selectedService}.`;
    const formattedText = `Hi Graphitex!\n\n*Name:* ${finalName}\n*Service Requested:* ${selectedService}\n*Message:* ${cleanMessage}`;
    const encodedText = encodeURIComponent(formattedText);
    window.open(`https://wa.me/919999999999?text=${encodedText}`, "_blank");
  };


  return (
    <div className={styles.pageWrapper}>
      {/* ── AMBIENT BACKGROUND ── */}
      <div className={styles.ambientBg} aria-hidden="true">
        <div className={styles.ambientOrb1} />
        <div className={styles.ambientOrb2} />
        <div className={styles.ambientOrb3} />
      </div>

      {/* ── LANDSCAPE HERO CAROUSEL (LIMITED HEIGHT) ── */}
      <section className={styles.landscapeCarouselSection} aria-label="Featured highlights slider">
        <div className={`container ${styles.carouselInner}`}>
          <div className={styles.carouselContainer}>
            {heroCarouselSlides.map((slide, index) => {
              const isActive = index === activeSlide;
              return (
                <div
                  key={index}
                  className={`${styles.carouselSlide} ${isActive ? styles.carouselSlideActive : ""}`}
                  aria-hidden={!isActive}
                >
                  {slide.actionType === "scroll" ? (
                    <button
                      onClick={() => {
                        document.getElementById(slide.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={styles.slideBannerLink}
                      aria-label={slide.title}
                    >
                      <img src={slide.image} alt={slide.title} className={styles.slideBannerImage} />
                      {/* @ts-ignore */}
                      {slide.showOverlay && (
                        <div className={styles.slideContentOverlay}>
                          {slide.subtitle && <p className={styles.slideSubtitle}>{slide.subtitle}</p>}
                          {slide.title && <h3 className={styles.slideTitle}>{slide.title}</h3>}
                          {slide.desc && <p className={styles.slideDescription}>{slide.desc}</p>}
                          {slide.ctaText && <span className={styles.slideCtaBadge}>{slide.ctaText}</span>}
                        </div>
                      )}
                    </button>
                  ) : (
                    <Link href={slide.target} className={styles.slideBannerLink} aria-label={slide.title}>
                      <img src={slide.image} alt={slide.title} className={styles.slideBannerImage} />
                      {/* @ts-ignore */}
                      {slide.showOverlay && (
                        <div className={styles.slideContentOverlay}>
                          {slide.subtitle && <p className={styles.slideSubtitle}>{slide.subtitle}</p>}
                          {slide.title && <h3 className={styles.slideTitle}>{slide.title}</h3>}
                          {slide.desc && <p className={styles.slideDescription}>{slide.desc}</p>}
                          {slide.ctaText && <span className={styles.slideCtaBadge}>{slide.ctaText}</span>}
                        </div>
                      )}
                    </Link>
                  )}
                </div>
              );
            })}

            {/* Navigation Arrows */}
            <button
              onClick={() => setActiveSlide((prev) => (prev - 1 + heroCarouselSlides.length) % heroCarouselSlides.length)}
              className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setActiveSlide((prev) => (prev + 1) % heroCarouselSlides.length)}
              className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dotted Indicators */}
            <div className={styles.carouselDots}>
              {heroCarouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`${styles.carouselDot} ${index === activeSlide ? styles.carouselDotActive : ""}`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1 — HERO: SEARCH-FIRST                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className={styles.heroSection} aria-label="Search for services and creators">
        <div className={`container ${styles.heroInner}`}>
          {/* Badge */}
          <div className={styles.heroBadge}>
            <Zap size={13} />
            <span>India&apos;s Creative Marketplace</span>
          </div>

          {/* Animated Headline */}
          <h1 className={styles.heroTitle}>
            <span className={`${styles.heroTitleAnimated} ${headlineFading ? styles.heroTitleFade : ""}`}>
              {heroHeadlines[headlineIndex]}
            </span>
          </h1>

          <p className={styles.heroSubtitle}>
            Discover verified influencers, local businesses, and creative agencies — all in one place.
          </p>

          {/* Search Bar */}
          <form className={styles.searchForm} onSubmit={handleSearch} role="search">
            <div className={styles.searchBar}>
              {/* Location Select */}
              <div className={styles.searchLocationGroup}>
                <MapPin size={16} className={styles.searchIcon} />
                <select
                  id="search-location"
                  className={styles.searchLocationSelect}
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  aria-label="Select location"
                >
                  <option>Mangalore</option>
                  <option>Bengaluru</option>
                  <option>Mumbai</option>
                  <option>Delhi</option>
                  <option>Hyderabad</option>
                  <option>Pune</option>
                  <option>Chennai</option>
                  <option>Kolkata</option>
                  <option>Ahmedabad</option>
                  <option>Jaipur</option>
                  <option>Kochi</option>
                </select>
              </div>

              <div className={styles.searchDivider} />

              {/* Keyword Input */}
              <div className={styles.searchKeywordGroup}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  id="search-keyword"
                  type="text"
                  placeholder="Search businesses, services..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className={styles.searchInput}
                  aria-label="Search keyword"
                />
              </div>

              <button type="submit" className={styles.searchBtn} aria-label="Search">
                <Search size={18} />
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Popular Search Pills */}
          <div className={styles.popularRow}>
            <span className={styles.popularLabel}>Popular:</span>
            {popularCategories.map((cat) => (
              <button
                key={cat}
                className={styles.popularPill}
                onClick={() => {
                  router.push(`/services?category=${encodeURIComponent(cat)}`);
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Action Cards */}
          <div className={styles.heroActions}>
            <Link href="/services" className={styles.heroActionCard} id="hero-action-businesses">
              <div className={styles.heroActionIcon} style={{ background: "hsl(268, 85%, 52%)" }}>
                <Shield size={24} color="white" />
              </div>
              <div>
                <div className={styles.heroActionTitle}>Businesses</div>
                <div className={styles.heroActionSub}>Get discovered by brands & buyers</div>
              </div>
              <ArrowRight size={18} className={styles.heroActionArrow} />
            </Link>
            <Link href="/influencers" className={styles.heroActionCard} id="hero-action-creators">
              <div className={styles.heroActionIcon} style={{ background: "hsl(192, 95%, 48%)" }}>
                <Star size={24} color="white" />
              </div>
              <div>
                <div className={styles.heroActionTitle}>Creators</div>
                <div className={styles.heroActionSub}>Join campaigns & grow your reach</div>
              </div>
              <ArrowRight size={18} className={styles.heroActionArrow} />
            </Link>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3 — BROWSE BY CATEGORY                                   */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className={`container ${styles.section}`} aria-label="Browse categories">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Browse by Niche</span>
          <h2 className={styles.sectionTitle}>Explore Every Category</h2>
          <p className={styles.sectionSubtitle}>
            From fashion to food — find exactly what you are looking for across 50+ categories.
          </p>
        </div>

        <div className={styles.categoryStrip}>
          {categories.map((cat) => {
            return (
              <Link
                key={cat.slug}
                href={`/services?category=${encodeURIComponent(cat.slug)}`}
                className={styles.categoryCard}
                id={`category-${cat.slug.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className={styles.categoryImageWrap}>
                  <img src={cat.image} alt={cat.label} className={styles.categoryImage} />
                </div>
                <div className={styles.categoryLabelWrap}>
                  <div className={styles.categoryLabel}>{cat.label}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className={styles.sectionCta}>
          <Link href="/services">
            <Button variant="outline" size="sm" icon={<ArrowRight size={15} />}>
              View All Categories
            </Button>
          </Link>
        </div>
      </section>



      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 6 — WHY GRAPHITEX (TRUST BADGES)                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className={styles.trustSection} aria-label="Why choose Graphitex">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Why Graphitex?</span>
            <h2 className={styles.sectionTitle}>Built on Trust & Transparency</h2>
            <p className={styles.sectionSubtitle}>
              Every listing is verified. Every connection is direct. No middlemen, no hidden fees.
            </p>
          </div>

          <div className={styles.trustGrid}>
            {[
              {
                Icon: Shield,
                color: "#7C3AED",
                bg: "rgba(124,58,237,0.08)",
                title: "Verified Profiles",
                desc: "Every business and influencer is manually reviewed and verified before going live on our platform.",
              },
              {
                Icon: MessageSquare,
                color: "#0891B2",
                bg: "rgba(8,145,178,0.08)",
                title: "Direct Contact",
                desc: "Connect directly via WhatsApp — no intermediaries or broker fees. Real conversations, real results.",
              },
              {
                Icon: Eye,
                color: "#D97706",
                bg: "rgba(217,119,6,0.08)",
                title: "Free to Browse",
                desc: "Browse our entire directory of businesses, influencers, and campaigns completely free. No signup required.",
              },
              {
                Icon: Zap,
                color: "#059669",
                bg: "rgba(5,150,105,0.08)",
                title: "Instant Matching",
                desc: "Our smart platform helps brands find the right creators and businesses discover the right campaigns quickly.",
              },
              {
                Icon: MapPin,
                color: "#D97706",
                bg: "rgba(217,119,6,0.08)",
                title: "Hyper-Local Search",
                desc: "Locate verified services or opportunities in your area with precise address details, city/state filters, and Google Map embeds.",
              },
              {
                Icon: TrendingUp,
                color: "#7C3AED",
                bg: "rgba(124,58,237,0.08)",
                title: "Real-Time Alerts",
                desc: "Get notified instantly via dynamic push alerts and dashboard badges when applications are approved or updated.",
              },
            ].map(({ Icon, color, bg, title, desc }) => (
              <div className={styles.trustCard} key={title}>
                <div className={styles.trustIconWrap} style={{ background: bg, color }}>
                  <Icon size={28} />
                </div>
                <h3 className={styles.trustTitle}>{title}</h3>
                <p className={styles.trustDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 7 — HOW IT WORKS                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className={`container ${styles.section}`} aria-label="How it works">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Simple Process</span>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          <p className={styles.sectionSubtitle}>Get started in minutes — whether you are a brand or a creator.</p>
        </div>

        <div className={styles.stepsGrid}>
          {[
            {
              step: "01",
              color: "#7C3AED",
              bg: "rgba(124,58,237,0.06)",
              title: "Create Your Profile",
              desc: "Register and set up your business or creator profile in minutes. Add your portfolio, location, and niche categories.",
              Icon: Shield,
            },
            {
              step: "02",
              color: "#0891B2",
              bg: "rgba(8,145,178,0.06)",
              title: "Get Discovered",
              desc: "Your verified profile is instantly visible to thousands of brands and creators actively searching for collaborations.",
              Icon: Eye,
            },
            {
              step: "03",
              color: "#D97706",
              bg: "rgba(217,119,6,0.06)",
              title: "Connect & Collaborate",
              desc: "Apply to campaigns or receive direct inquiries. Connect via WhatsApp and start creating magic together.",
              Icon: Zap,
            },
          ].map(({ step, color, bg, title, desc, Icon }) => (
            <div className={styles.stepCard} key={step} style={{ backgroundColor: color }}>
              <div className={styles.stepNumber} style={{ color: color, backgroundColor: "#fff", borderColor: "#fff" }}>
                {step}
              </div>
              <div className={styles.stepIconWrap} style={{ backgroundColor: "rgba(255, 255, 255, 0.18)", color: "#fff" }}>
                <Icon size={24} />
              </div>
              <h3 className={styles.stepTitle}>{title}</h3>
              <p className={styles.stepDesc}>{desc}</p>
            </div>
          ))}
        </div>

        <div className={styles.stepsConnector} aria-hidden="true" />

        <div className={styles.sectionCta}>
          <Link href="/login">
            <Button size="lg" icon={<Zap size={16} />}>
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 5 — AGENCY SERVICES                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className={`container ${styles.section}`} id="services-agency" aria-label="Agency services">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Creative Solutions</span>
          <h2 className={styles.sectionTitle}>Our Agency Services</h2>
          <p className={styles.sectionSubtitle}>
            End-to-end creative production, page management, and performance marketing to elevate your brand and sales.
          </p>
        </div>

        <div className={styles.agencyGrid}>
          {[
            {
              image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=600&auto=format&fit=crop",
              Icon: Paintbrush,
              color: "primary",
              title: "Graphic Designing",
              desc: "Brand identity, vector logos, custom social creatives, and premium print designs that capture instant customer attention.",
            },
            {
              image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop",
              Icon: Camera,
              color: "secondary",
              title: "Ad Shoots & Content",
              desc: "Professional videography and video editing tailored for high-converting social media ads and marketing campaigns.",
            },
            {
              image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=600&auto=format&fit=crop",
              Icon: null,
              color: "accent",
              title: "Instagram Page Handling",
              desc: "End-to-end strategic page calendar planning, aesthetic creative post designs, community engagement, and organic growth.",
            },
            {
              image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop",
              Icon: TrendingUp,
              color: "primary",
              title: "Digital Marketing",
              desc: "High-ranking SEO audits, paid performance advertisement (Meta/Google), and conversion rate performance analytics.",
            },
            {
              image: "https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=600&auto=format&fit=crop",
              Icon: Code,
              color: "secondary",
              title: "Website Development",
              desc: "Modern, ultra-fast loading, search engine optimized, and fully responsive digital websites built using the latest tech frameworks.",
            },
            {
              image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600&auto=format&fit=crop",
              Icon: Users,
              color: "accent",
              title: "Influencer Marketing",
              desc: "Connecting your company brand with the right content creators to reach extremely loyal, organic, and highly active audiences.",
            },
          ].map(({ image, Icon, color, title, desc }) => (
            <div className={styles.agencyCard} key={title}>
              <div className={styles.agencyCardImage}>
                <img src={image} alt={title} loading="lazy" />
                <div className={styles.agencyCardOverlay} />
              </div>
              <div className={styles.agencyCardBody}>
                <div className={`${styles.agencyIcon} ${styles[`agencyIcon_${color}`]}`}>
                  {Icon ? (
                    <Icon size={20} />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  )}
                </div>
                <h3 className={styles.agencyCardTitle}>{title}</h3>
                <p className={styles.agencyCardDesc}>{desc}</p>
                <button
                  onClick={() => handleEnquireClick(title)}
                  className={styles.agencyEnquireBtn}
                >
                  Enquire Now <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 9 — WHATSAPP ENQUIRY FORM                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <section className={`container ${styles.section}`} id="whatsapp-enquiry" aria-label="WhatsApp enquiry">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTag}>Instant Enquiry</span>
          <h2 className={styles.sectionTitle}>Enquire About Our Agency Services</h2>
          <p className={styles.sectionSubtitle}>
            Select your desired service, enter your name and message, and connect directly with us on WhatsApp.
          </p>
        </div>

        <div className={styles.enquiryContainer}>
          {/* Left: Info Panel */}
          <div className={styles.enquiryInfo}>
            <h3 className={styles.enquiryInfoTitle}>Why WhatsApp?</h3>
            <p className={styles.enquiryInfoText}>
              Get immediate responses, dedicated executive consultations, and personalized campaign strategy blueprints.
            </p>
            <div className={styles.enquiryFeatures}>
              {[
                "Instant Reply Within 15 Mins",
                "Direct Executive Consultation",
                "Free Strategy & Pricing Blueprint",
              ].map((f) => (
                <div className={styles.enquiryFeatureRow} key={f}>
                  <CheckCircle size={16} className={styles.enquiryFeatureCheck} />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {/* WhatsApp contact pill */}
            <div className={styles.enquiryContactPill}>
              <Phone size={15} />
              <span>+91 99999 99999</span>
            </div>
          </div>

          {/* Right: Form */}
          <form onSubmit={handleWhatsAppSend} className={styles.enquiryForm}>
            <div className={styles.formGroup}>
              <label htmlFor="wa-name" className={styles.formLabel}>Your Name</label>
              <input
                id="wa-name"
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={styles.formInput}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="wa-service" className={styles.formLabel}>Select Service</label>
              <select
                id="wa-service"
                value={selectedService}
                onChange={(e) => handleServiceChange(e.target.value)}
                className={styles.formSelect}
              >
                <option>Graphic Designing</option>
                <option>Ad Shoots & Content</option>
                <option>Instagram Page Handling</option>
                <option>Digital Marketing</option>
                <option>Website Development</option>
                <option>Influencer Marketing</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="wa-message" className={styles.formLabel}>Message</label>
              <textarea
                id="wa-message"
                placeholder="Details of your request..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className={styles.formTextarea}
                required
              />
            </div>
            <button type="submit" className={styles.whatsappBtn}>
              <Send size={16} />
              Send to WhatsApp
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
