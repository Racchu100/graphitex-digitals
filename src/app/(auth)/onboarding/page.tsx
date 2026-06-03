"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PhoneInput from "@/components/auth/PhoneInput";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle } from "lucide-react";
import { resolveStaleMobileUser } from "./actions";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    country_id: "1",
    state_id: "",
    city_id: "",
    roles: { influencer: false, provider: false },
    provider_subtype: ""
  });

  const [hasPhone, setHasPhone] = useState(true);
  const [states, setStates] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const phoneVal = user.phone || user.user_metadata?.phone || "";
        setHasPhone(!!phoneVal);

        // Fetch existing database user record if any
        const { data: dbUser } = await supabase
          .from("users")
          .select("name, email, state_id, city_id, mobile_number")
          .eq("id", user.id)
          .maybeSingle();

        setFormData(prev => ({
          ...prev,
          name: prev.name || dbUser?.name || user.user_metadata?.full_name || user.user_metadata?.name || "",
          email: prev.email || dbUser?.email || (user.email && !user.email.toLowerCase().endsWith("@graphitex.app") ? user.email : ""),
          state_id: prev.state_id || (dbUser?.state_id ? String(dbUser.state_id) : ""),
          city_id: prev.city_id || (dbUser?.city_id ? String(dbUser.city_id) : ""),
          mobileNumber: prev.mobileNumber || (dbUser?.mobile_number ? dbUser.mobile_number.replace("+91", "") : ""),
        }));

        if (dbUser?.mobile_number && !dbUser.mobile_number.startsWith("google-")) {
          setHasPhone(true);
        }
      }
    }
    loadUserData();
  }, [supabase]);

  useEffect(() => {
    setStatesLoading(true);
    fetch("/api/locations/states?country_id=1")
      .then(r => r.json())
      .then(d => setStates(d.states ?? []))
      .catch(() => {})
      .finally(() => setStatesLoading(false));
  }, []);

  useEffect(() => {
    if (!formData.state_id) { setCities([]); return; }
    setCitiesLoading(true);
    fetch(`/api/locations/cities?state_id=${formData.state_id}`)
      .then(r => r.json())
      .then(d => setCities(d.cities ?? []))
      .catch(() => {})
      .finally(() => setCitiesLoading(false));
  }, [formData.state_id]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name.trim()) { setError("Please enter your full name."); return; }
      if (!hasPhone && (!formData.mobileNumber || formData.mobileNumber.length < 10)) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
    }
    if (step === 2 && !formData.state_id) { setError("Please select a state."); return; }
    if (step === 2 && !formData.city_id) { setError("Please select a city."); return; }
    setError("");
    setStep(s => s + 1);
  };
  const handleBack = () => { setError(""); setStep(s => s - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roles.influencer && !formData.roles.provider) {
      setError("Please select at least one role.");
      return;
    }
    if (formData.roles.provider && !formData.provider_subtype) {
      setError("Please select a provider type.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found. Please login again.");

      let extractedPhone = user.phone || user.user_metadata?.phone || "";
      if (!extractedPhone && formData.mobileNumber) {
        extractedPhone = `+91${formData.mobileNumber}`;
      }

      if (!extractedPhone && user.email) {
        if (user.email.toLowerCase().endsWith("@graphitex.app")) {
          extractedPhone = user.email.split("@")[0];
        } else {
          if (user.email.length > 20) {
            extractedPhone = `google-${user.id.slice(0, 13)}`;
          } else {
            extractedPhone = user.email;
          }
        }
      }

      if (!extractedPhone) {
        extractedPhone = `google-${user.id.slice(0, 13)}`;
      }
      
      // Ensure the value does not exceed the VARCHAR(20) limit
      const cleanPhone = extractedPhone.slice(0, 20);

      // Ensure any conflicting stale/orphaned user record is resolved first
      if (cleanPhone) {
        await resolveStaleMobileUser(user.id, cleanPhone);
      }

      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: formData.name,
          email: formData.email || null,
          mobile_number: cleanPhone || '',
          mobile_verified: true,
          country_id: parseInt(formData.country_id),
          state_id: parseInt(formData.state_id),
          city_id: parseInt(formData.city_id),
          status: 'active'
        }, { onConflict: 'id' });

      if (userError) throw userError;

      if (formData.roles.influencer) {
        await supabase.from('user_roles').insert({ user_id: user.id, role: 'influencer' });
      }
      if (formData.roles.provider) {
        await supabase.from('user_roles').insert({ 
          user_id: user.id, 
          role: 'provider', 
          provider_subtype: formData.provider_subtype || null 
        });
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("user-profile-updated"));
      }
      router.push("/dashboard/profile");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding.");
    } finally {
      setLoading(false);
    }
  };

  const sel: React.CSSProperties = {
    width: "100%", padding: "var(--space-3) var(--space-4)",
    background: "var(--color-surface-elevated)", border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)", color: "var(--color-text-primary)",
    fontSize: "var(--text-base)", marginTop: "4px",
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGlow} />
      
      <Card className={styles.card} padding="lg">
        <div className={styles.progressContainer}>
           <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${(step / 3) * 100}%` }} />
           </div>
           <span className={styles.stepText}>Step {step} of 3</span>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>
            {step === 1 && "Basic Info"}
            {step === 2 && "Location"}
            {step === 3 && "Choose your role"}
          </h1>
          <p className={styles.subtitle}>
            {step === 1 && "Let's start with your details."}
            {step === 2 && "Where are you located?"}
            {step === 3 && "How will you use the platform?"}
          </p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className={styles.form}>
          
          {/* Step 1 */}
          <div className={`${styles.stepContent} ${step === 1 ? styles.active : ''}`}>
            <Input label="Full Name" value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required placeholder="John Doe" />
            <Input label="Email (Optional)" type="email" value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="john@example.com" />
            {!hasPhone && (
              <div style={{ marginTop: "var(--space-4)" }}>
                <PhoneInput
                  label="Mobile Number"
                  value={formData.mobileNumber}
                  onChange={(val) => setFormData({ ...formData, mobileNumber: val })}
                  required
                />
              </div>
            )}
          </div>

          {/* Step 2 — State → City */}
          <div className={`${styles.stepContent} ${step === 2 ? styles.active : ''}`}>
            <div>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-secondary)" }}>
                State *
              </label>
              <select style={sel} value={formData.state_id}
                onChange={(e) => setFormData({ ...formData, state_id: e.target.value, city_id: "" })}
                disabled={statesLoading}>
                <option value="">{statesLoading ? "Loading states..." : "Select state..."}</option>
                {states.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ marginTop: "var(--space-4)" }}>
              <label style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-secondary)" }}>
                City *
              </label>
              <select style={sel} value={formData.city_id}
                onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                disabled={!formData.state_id || citiesLoading}>
                <option value="">
                  {!formData.state_id ? "Select state first" : citiesLoading ? "Loading cities..." : "Select city..."}
                </option>
                {cities.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`${styles.stepContent} ${step === 3 ? styles.active : ''}`}>
             <label className={styles.roleCard}>
                <input type="radio" name="role" checked={formData.roles.influencer}
                  onChange={() => setFormData({
                    ...formData,
                    roles: { influencer: true, provider: false },
                    provider_subtype: ""
                  })} />
                <div className={styles.roleInfo}>
                  <div className={styles.roleTitle}>Influencer</div>
                  <div className={styles.roleDesc}>I want to find opportunities and collaborate.</div>
                </div>
             </label>

             <label className={styles.roleCard}>
                <input type="radio" name="role" checked={formData.roles.provider}
                  onChange={() => setFormData({
                    ...formData,
                    roles: { influencer: false, provider: true }
                  })} />
                <div className={styles.roleInfo}>
                  <div className={styles.roleTitle}>Service Provider</div>
                  <div className={styles.roleDesc}>I want to list my business and find influencers.</div>
                </div>
             </label>

             {formData.roles.provider && (
               <div className={styles.subtypeGroup} style={{ marginTop: "var(--space-4)" }}>
                  <label className={styles.label} style={{ marginBottom: "var(--space-1)" }}>Provider Type *</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "4px" }}>
                    <div 
                      className={styles.roleCard} 
                      style={{ 
                        padding: "var(--space-3)", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "var(--space-3)", 
                        opacity: 0.6,
                        cursor: "not-allowed",
                        borderColor: "rgba(202, 138, 4, 0.25)",
                        background: "rgba(202, 138, 4, 0.02)",
                        borderStyle: "dashed"
                      }}
                      onClick={() => alert("Freelancer registration is currently unavailable. Please select Local Business.")}
                    >
                      <input 
                        type="radio" 
                        name="provider_subtype" 
                        disabled
                        checked={false}
                        onChange={() => {}}
                        style={{ cursor: "not-allowed" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-secondary)" }}>
                          Freelancer
                        </span>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#ca8a04", fontWeight: "var(--weight-semibold)" }}>
                          <AlertTriangle size={13} color="#ca8a04" />
                          <span>Currently Unavailable</span>
                        </div>
                      </div>
                    </div>

                    <label className={styles.roleCard} style={{ padding: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <input 
                        type="radio" 
                        name="provider_subtype" 
                        checked={formData.provider_subtype === 'local_service'}
                        onChange={() => setFormData({ ...formData, provider_subtype: 'local_service' })}
                      />
                      <div className={styles.roleTitle} style={{ fontSize: "var(--text-sm)", margin: 0, fontWeight: "var(--weight-semibold)" }}>
                        Local Business
                      </div>
                    </label>
                  </div>
               </div>
             )}
          </div>

          <div className={styles.actions}>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>Back</Button>
            )}
            <Button type="submit" loading={loading} className={styles.nextBtn}>
              {step === 3 ? "Complete" : "Next"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
