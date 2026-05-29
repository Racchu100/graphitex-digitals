"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { ArrowLeft, Plus, Edit3, Eye, EyeOff, Trash2 } from "lucide-react";
import InfluencerForm from "@/components/forms/InfluencerForm";
import ServiceForm from "@/components/forms/ServiceForm";
import { BusinessProfile } from "@/types/database";

function ProfileDashboardContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, roles, loading: userLoading } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_number: "",
    state_id: "",
    city_id: "",
  });

  const [states, setStates] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Consolidated Tab Selection state
  const [activeTab, setActiveTab] = useState<"account" | "influencer" | "services">("account");
  const [infProfile, setInfProfile] = useState<any>(null);
  const [infLoading, setInfLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // My Services state
  const [services, setServices] = useState<BusinessProfile[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<BusinessProfile | null>(null);

  const isInfluencer = Array.isArray(roles) && roles.some((r) => r?.role === "influencer");
  const isProvider = Array.isArray(roles) && roles.some((r) => r?.role === "provider");

  // Read URL search params for pre-selecting the active tab and triggering overlays reactively
  useEffect(() => {
    if (searchParams) {
      const tab = searchParams.get("tab");
      if (tab === "influencer" || tab === "account" || tab === "services") {
        setActiveTab(tab as "account" | "influencer" | "services");
      }
      if (searchParams.get("showProviderStatusAlert") === "true") {
        // Read local storage defensively to check if they completed onboarding already
        let hasOnboarded = false;
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            hasOnboarded = window.localStorage.getItem("graphitex_provider_onboarded") === "true";
          }
        } catch (e) {
          console.warn("localStorage read blocked:", e);
        }

        // Only show status modal overlay if they haven't onboarded yet (meaning they are a brand new user!)
        if (!hasOnboarded) {
          setShowStatusModal(true);
          // Set onboarded flag in local storage so it only triggers the very first time
          try {
            if (typeof window !== "undefined" && window.localStorage) {
              window.localStorage.setItem("graphitex_provider_onboarded", "true");
            }
          } catch (e) {
            console.warn("localStorage write blocked:", e);
          }
        } else {
          // If they already onboarded, cleanly strip the query parameter from the URL
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("showProviderStatusAlert");
            window.history.replaceState({}, "", url.pathname + url.search);
          }
        }
      }
    }
  }, [searchParams]);

  // 1. Fetch States on mount
  useEffect(() => {
    setStatesLoading(true);
    fetch("/api/locations/states?country_id=1")
      .then((r) => r.json())
      .then((d) => setStates(d.states ?? []))
      .catch(() => {})
      .finally(() => setStatesLoading(false));
  }, []);

  // 2. Fetch Cities when state changes
  useEffect(() => {
    if (!formData.state_id) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    fetch(`/api/locations/cities?state_id=${formData.state_id}`)
      .then((r) => r.json())
      .then((d) => setCities(d.cities ?? []))
      .catch(() => {})
      .finally(() => setCitiesLoading(false));
  }, [formData.state_id]);

  // 3. Sync User Info from reactive useUser hook safely to break loading freezes
  useEffect(() => {
    if (!userLoading) {
      if (user) {
        setFormData({
          name: user.name || "",
          email: user.email || "",
          mobile_number: user.mobile_number || "",
          state_id: user.state_id ? String(user.state_id) : "",
          city_id: user.city_id ? String(user.city_id) : "",
        });
      }
      setLoading(false);
    }
  }, [user, userLoading]);

  // 4. Fetch Influencer Profile if user is an influencer
  useEffect(() => {
    if (!user || !isInfluencer) return;

    setInfLoading(true);
    supabase
      .from("influencer_profiles")
      .select("*, influencer_social_accounts(*)")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }: { data: any; error: any }) => {
        if (data) {
          setInfProfile(data);
        }
      })
      .catch((err: any) => console.warn("Failed to fetch influencer profile on mount:", err))
      .finally(() => setInfLoading(false));
  }, [user, isInfluencer, supabase]);

  const fetchServices = async () => {
    if (!user || !isProvider) return;
    try {
      setServicesLoading(true);
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*, cities(name), states(name), business_media(url, media_type)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (data) {
        setServices(data as any[]);
      }
    } catch (err) {
      console.warn("Failed to fetch services in ProfilePage:", err);
    } finally {
      setServicesLoading(false);
    }
  };

  // 5. Fetch Services if user is a provider
  useEffect(() => {
    if (userLoading) return;
    if (!user || !isProvider) {
      setServicesLoading(false);
      return;
    }
    fetchServices();
  }, [user, userLoading, isProvider]);

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      // Delete associated media first to prevent any foreign key constraints
      await supabase
        .from("business_media")
        .delete()
        .eq("business_profile_id", serviceId);

      // Delete the business profile row itself
      const { error } = await supabase
        .from("business_profiles")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      // Refresh the services array client-side by filtering out the deleted service
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (err: any) {
      alert("Failed to delete service: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!user) throw new Error("You must be logged in to update your profile.");

      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: formData.name,
          email: formData.email || null,
          state_id: parseInt(formData.state_id),
          city_id: parseInt(formData.city_id),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Sync location details to business_profiles if exists
      const { error: bizUpdateError } = await supabase
        .from("business_profiles")
        .update({
          state_id: parseInt(formData.state_id),
          city_id: parseInt(formData.city_id),
        })
        .eq("user_id", user.id);

      if (bizUpdateError) {
        console.warn("Failed to sync location to business profile:", bizUpdateError);
      }

      // Sync location details to influencer_profiles if exists
      const { error: infUpdateError } = await supabase
        .from("influencer_profiles")
        .update({
          state_id: parseInt(formData.state_id),
          city_id: parseInt(formData.city_id),
        })
        .eq("user_id", user.id);

      if (infUpdateError) {
        console.warn("Failed to sync location to influencer profile:", infUpdateError);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user-profile-updated"));
      }

      const isProvider = Array.isArray(roles) && roles.some((r) => r?.role === "provider");

      if (isInfluencer) {
        setSuccess("Account settings saved successfully! Loading your influencer profile...");
        setTimeout(() => {
          setActiveTab("influencer");
          setSuccess("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 1500);
      } else if (isProvider) {
        setSuccess("Profile updated successfully! Saving changes...");
        setTimeout(() => {
          setActiveTab("services");
          setSuccess("");
          window.scrollTo({ top: 0, behavior: "smooth" });
          router.push("/dashboard/profile?tab=services");
        }, 1500);
      } else {
        setSuccess("Profile updated successfully! Redirecting...");
        setTimeout(() => {
          router.push("/services");
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const sel: React.CSSProperties = {
    width: "100%",
    padding: "var(--select-padding, var(--space-3) var(--space-4))",
    background: "var(--color-surface-elevated)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    color: "var(--color-text-primary)",
    fontSize: "var(--select-font-size, var(--text-base))",
    marginTop: "4px",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  };

  if (loading || userLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Loading profile details...</p>
      </div>
    );
  }

  const avatarInitials = formData.name ? formData.name.charAt(0).toUpperCase() : "G";

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--profile-container-padding, var(--space-4) 0)" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <h1 style={{ fontSize: "var(--profile-title-size, var(--text-4xl))", marginBottom: "var(--space-1)" }}>My Profile</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--profile-desc-size, var(--text-base))" }}>
          {isInfluencer || isProvider
            ? "Manage both your account settings and public listings in one unified dashboard." 
            : "Manage your personal details, locations, and roles."}
        </p>
      </div>

      {/* Tabs Menu Selection (displayed to Influencers and Providers) */}
      {(isInfluencer || isProvider) && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-2)",
          marginBottom: "var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "var(--space-2)"
        }}>
          <button
            onClick={() => {
              setActiveTab("account");
              router.replace("/dashboard/profile?tab=account");
            }}
            style={{
              padding: "var(--tab-padding, 10px 20px)",
              borderRadius: "var(--radius-md) var(--radius-md) 0 0",
              border: "none",
              background: activeTab === "account" ? "var(--color-primary)" : "transparent",
              color: activeTab === "account" ? "#ffffff" : "var(--color-text-secondary)",
              fontWeight: "600",
              fontSize: "var(--tab-font-size, var(--text-sm))",
              cursor: "pointer",
              transition: "all 0.2s ease",
              borderBottom: activeTab === "account" ? "3px solid hsl(263, 60%, 45%)" : "none",
              flex: "var(--tab-flex, none)",
              whiteSpace: "nowrap",
              textAlign: "center"
            }}
          >
            👤 Account Settings
          </button>
          {isInfluencer && (
            <button
              onClick={() => {
                setActiveTab("influencer");
                router.replace("/dashboard/profile?tab=influencer");
              }}
              style={{
                padding: "var(--tab-padding, 10px 20px)",
                borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                border: "none",
                background: activeTab === "influencer" ? "var(--color-primary)" : "transparent",
                color: activeTab === "influencer" ? "#ffffff" : "var(--color-text-secondary)",
                fontWeight: "600",
                fontSize: "var(--tab-font-size, var(--text-sm))",
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom: activeTab === "influencer" ? "3px solid hsl(263, 60%, 45%)" : "none",
                flex: "var(--tab-flex, none)",
                whiteSpace: "nowrap",
                textAlign: "center"
              }}
            >
              📷 Influencer Profile
            </button>
          )}
          {isProvider && (
            <button
              onClick={() => {
                setActiveTab("services");
                router.replace("/dashboard/profile?tab=services");
              }}
              style={{
                padding: "var(--tab-padding, 10px 20px)",
                borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                border: "none",
                background: activeTab === "services" ? "var(--color-primary)" : "transparent",
                color: activeTab === "services" ? "#ffffff" : "var(--color-text-secondary)",
                fontWeight: "600",
                fontSize: "var(--tab-font-size, var(--text-sm))",
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom: activeTab === "services" ? "3px solid hsl(263, 60%, 45%)" : "none",
                flex: "var(--tab-flex, none)",
                whiteSpace: "nowrap",
                textAlign: "center"
              }}
            >
              💼 My Services
            </button>
          )}
        </div>
      )}

      {/* Render selected active tab */}
      {activeTab === "account" && (
        <Card padding="lg" style={{ marginBottom: "var(--space-6)" }}>
          {/* Profile Avatar & Roles Banner */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--avatar-gap, var(--space-5))", paddingBottom: "var(--avatar-padding-bottom, var(--space-6))", borderBottom: "1px solid var(--color-border)", marginBottom: "var(--avatar-margin-bottom, var(--space-6))" }}>
            <div style={{
              width: "var(--avatar-size, 72px)",
              height: "var(--avatar-size, 72px)",
              borderRadius: "50%",
              background: user?.avatar_url ? "none" : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--avatar-font-size, var(--text-3xl))",
              fontWeight: "var(--weight-bold)",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
              overflow: "hidden"
            }}>
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={user.avatar_url} 
                  alt="Avatar" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              ) : (
                avatarInitials
              )}
            </div>
            <div>
              <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "4px" }}>{formData.name || "User Profile"}</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {roles.map((r) => {
                  let labelText = r.role.replace("_", " ");
                  if (r.role === "provider") {
                    if (r.provider_subtype === "local_service") labelText = "Local Business";
                    else if (r.provider_subtype === "freelancer") labelText = "Freelancer";
                    else if (r.provider_subtype === "business_owner") labelText = "Business Owner";
                  }

                  return (
                    <span key={r.id} style={{
                      fontSize: "11px",
                      fontWeight: "var(--weight-semibold)",
                      textTransform: "uppercase",
                      padding: "2px 8px",
                      borderRadius: "50px",
                      background: "hsla(268, 85%, 52%, 0.1)",
                      color: "var(--color-primary)",
                      border: "1px solid hsla(268, 85%, 52%, 0.2)"
                    }}>
                      {labelText}
                    </span>
                  );
                })}
                {roles.length === 0 && (
                  <span style={{ fontSize: "11px", fontWeight: "var(--weight-semibold)", textTransform: "uppercase", padding: "2px 8px", borderRadius: "50px", background: "var(--color-border)", color: "var(--color-text-secondary)" }}>
                    Customer
                  </span>
                )}
              </div>
            </div>
          </div>

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

          {error && (
            <div style={{
              padding: "var(--space-4)",
              background: "rgba(239, 68, 68, 0.08)",
              color: "rgb(239, 68, 68)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-5)",
              fontSize: "var(--text-sm)",
              fontWeight: "var(--weight-medium)"
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "var(--grid-columns, 1fr 1fr)", gap: "var(--space-4)" }}>
              <Input
                label="Full Name *"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Mobile Number (Read-only)"
                name="mobile_number"
                value={formData.mobile_number}
                disabled
                style={{ opacity: 0.7, cursor: "not-allowed" }}
              />
            </div>

            <Input
              label="Email Address (Optional)"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. name@domain.com"
            />

            <div style={{ display: "grid", gridTemplateColumns: "var(--grid-columns, 1fr 1fr)", gap: "var(--space-4)", marginTop: "4px" }}>
              <div>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-secondary)" }}>
                  State *
                </label>
                <select
                  style={sel}
                  value={formData.state_id}
                  onChange={(e) => setFormData({ ...formData, state_id: e.target.value, city_id: "" })}
                  disabled={statesLoading}
                  required
                >
                  <option value="">{statesLoading ? "Loading states..." : "Select state..."}</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-secondary)" }}>
                  City *
                </label>
                <select
                  style={sel}
                  value={formData.city_id}
                  onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                  disabled={!formData.state_id || citiesLoading}
                  required
                >
                  <option value="">
                    {!formData.state_id ? "Select state first" : citiesLoading ? "Loading cities..." : "Select city..."}
                  </option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
              <Button type="submit" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === "influencer" && (
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-6)" }}>
          {infLoading ? (
            <p style={{ color: "var(--color-text-secondary)" }}>Loading portfolio and niche details...</p>
          ) : (
            <InfluencerForm initialData={infProfile} />
          )}
        </div>
      )}

      {activeTab === "services" && (
        <div>
          {showServiceForm ? (
            <div>
              <button
                onClick={() => {
                  setShowServiceForm(false);
                  setEditingService(null);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  background: "none",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  fontSize: "var(--text-sm)",
                  fontWeight: "var(--weight-medium)",
                  cursor: "pointer",
                  padding: "var(--space-1) var(--space-2)",
                  paddingLeft: 0,
                  marginBottom: "var(--space-4)",
                  transition: "color 0.2s ease, transform 0.2s ease",
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to My Services</span>
              </button>
              <h2 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-xl)" }}>
                {editingService ? "Edit Service" : "Create New Service"}
              </h2>
              <ServiceForm
                initialData={editingService || undefined}
                isEdit={!!editingService}
                onSuccess={(submitAction) => {
                  setShowServiceForm(false);
                  setEditingService(null);
                  
                  if (submitAction === "pending_approval") {
                    let hasOnboarded = false;
                    try {
                      if (typeof window !== "undefined" && window.localStorage) {
                        hasOnboarded = window.localStorage.getItem("graphitex_provider_onboarded") === "true";
                      }
                    } catch (e) {
                      console.warn("localStorage read blocked:", e);
                    }

                    // A provider is a first-time user if they don't have any existing services, or hasOnboarded is false
                    const isFirstTime = !hasOnboarded || services.length === 0;

                    if (isFirstTime) {
                      setShowStatusModal(true);
                      try {
                        if (typeof window !== "undefined" && window.localStorage) {
                          window.localStorage.setItem("graphitex_provider_onboarded", "true");
                        }
                      } catch (e) {
                        console.warn("localStorage write blocked:", e);
                      }
                    }
                  }
                  
                  fetchServices();
                }}
              />
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ margin: 0, fontSize: "var(--text-xl)" }}>My Services</h2>
                <Button
                  onClick={() => {
                    setEditingService(null);
                    setShowServiceForm(true);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <Plus size={16} />
                  Create Service
                </Button>
              </div>

              {servicesLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
                  <p style={{ color: "var(--color-text-secondary)" }}>Loading services...</p>
                </div>
              ) : services.length === 0 ? (
                <Card padding="lg" style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: "8px" }}>No Services Yet</h3>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
                    Create your first service profile to get listed in the public directory and start collaborating.
                  </p>
                  <Button
                    onClick={() => {
                      setEditingService(null);
                      setShowServiceForm(true);
                    }}
                  >
                    Create Service
                  </Button>
                </Card>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {services.map(service => (
                    <Card key={service.id} className="service-card">
                      <div className="service-card-container">
                        {/* Column 1: Info (Image + Details) */}
                        <div className="service-card-col-info">
                          <div className="service-card-img-wrapper">
                            {(() => {
                              const primaryImage = (service as any).business_media?.find((m: any) => m.media_type === "image")?.url || "/placeholder-service.jpg";
                              return (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={primaryImage} alt="" className="service-card-img" />
                              );
                            })()}
                          </div>
                          <div className="service-card-details">
                            <h3 className="service-card-title">{service.business_name}</h3>
                            <p className="service-card-status">
                              <span>
                                Status: <strong style={{ textTransform: 'capitalize', color: service.status === 'approved' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>{service.status.replace('_', ' ')}</strong>
                              </span>
                              <span className="service-card-dot">•</span>
                              <span className="service-card-visibility">
                                {service.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                                {service.is_public ? 'Public' : 'Hidden'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Column 2: Shop Location Column */}
                        <div className="service-card-col-location">
                          <span className="service-card-location-label">
                            Shop Location
                          </span>
                          {((service as any).cities?.name || (service as any).states?.name || service.address_line) ? (
                            <div className="service-card-location-details">
                              <p className="service-card-location-city">
                                <span className="service-card-location-pin">📍</span>
                                <span>
                                  {[(service as any).cities?.name, (service as any).states?.name].filter(Boolean).join(", ")}
                                </span>
                              </p>
                              {service.address_line && (
                                <p className="service-card-location-address" title={service.address_line}>
                                  {service.address_line}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="service-card-location-empty">
                              Not configured
                            </p>
                          )}
                        </div>

                        {/* Column 3: Actions */}
                        <div className="service-card-col-actions">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingService(service);
                              setShowServiceForm(true);
                            }}
                            className="service-card-btn"
                          >
                            <Edit3 size={14} />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            className="service-card-btn delete-btn"
                            style={{ 
                              borderColor: "rgba(239, 68, 68, 0.4)",
                              color: "rgb(239, 68, 68)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {showStatusModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          animation: "fadeIn 0.3s ease"
        }}>
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-6)",
            maxWidth: "480px",
            width: "90%",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            textAlign: "center",
            position: "relative",
            animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes scaleIn {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
            `}</style>

            <div style={{
              fontSize: "var(--text-4xl)",
              marginBottom: "var(--space-4)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "hsla(160, 84%, 39%, 0.1)",
              color: "rgb(16, 185, 129)",
              boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)",
              margin: "0 auto var(--space-4) auto"
            }}>
              ✅
            </div>

            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
              Profile Submitted Successfully!
            </h2>
            
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", lineHeight: "1.6", marginBottom: "var(--space-6)" }}>
              Within 24hrs our team will notify regarding your status. Thank you. Still, you can view our influencers page for collaboration.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "var(--color-primary)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  color: "#ffffff",
                  fontWeight: "600",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                  transition: "all 0.2s ease"
                }}
                onClick={() => {
                  setShowStatusModal(false);
                  if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("showProviderStatusAlert");
                    window.history.replaceState({}, "", url.pathname + url.search);
                  }
                  router.push("/influencers");
                }}
              >
                🔍 Explore Influencers
              </button>
              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text-secondary)",
                  fontWeight: "600",
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onClick={() => {
                  setShowStatusModal(false);
                  if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("showProviderStatusAlert");
                    window.history.replaceState({}, "", url.pathname + url.search);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--color-surface-elevated)";
                  e.currentTarget.style.color = "var(--color-text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--color-text-secondary)";
                }}
              >
                Dismiss & Stay on My Services
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Loading profile dashboard...</p>
      </div>
    }>
      <ProfileDashboardContent />
    </Suspense>
  );
}
