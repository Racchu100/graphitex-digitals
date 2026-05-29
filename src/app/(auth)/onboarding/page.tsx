"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country_id: "1",
    state_id: "",
    city_id: "",
    roles: { influencer: false, provider: false },
    provider_subtype: ""
  });

  const [states, setStates] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

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
    if (step === 1 && !formData.name.trim()) { setError("Please enter your full name."); return; }
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
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found. Please login again.");

      let extractedPhone = user.phone || user.user_metadata?.phone || "";
      if (!extractedPhone && user.email) {
        if (user.email.endsWith("@graphitex.app")) {
          extractedPhone = user.email.split("@")[0];
        } else {
          extractedPhone = user.email;
        }
      }
      
      // Ensure the value does not exceed the VARCHAR(20) limit
      const cleanPhone = extractedPhone.slice(0, 20);

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: formData.name,
          email: formData.email || null,
          mobile_number: cleanPhone || '',
          mobile_verified: true,
          country_id: parseInt(formData.country_id),
          state_id: parseInt(formData.state_id),
          city_id: parseInt(formData.city_id),
          status: 'active'
        });

      if (userError && userError.code !== '23505') throw userError;

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
                {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`${styles.stepContent} ${step === 3 ? styles.active : ''}`}>
             <label className={styles.roleCard}>
                <input type="checkbox" checked={formData.roles.influencer}
                  onChange={(e) => setFormData({...formData, roles: {...formData.roles, influencer: e.target.checked}})} />
                <div className={styles.roleInfo}>
                  <div className={styles.roleTitle}>Influencer</div>
                  <div className={styles.roleDesc}>I want to find opportunities and collaborate.</div>
                </div>
             </label>

             <label className={styles.roleCard}>
                <input type="checkbox" checked={formData.roles.provider}
                  onChange={(e) => setFormData({...formData, roles: {...formData.roles, provider: e.target.checked}})} />
                <div className={styles.roleInfo}>
                  <div className={styles.roleTitle}>Service Provider</div>
                  <div className={styles.roleDesc}>I want to list my business and find influencers.</div>
                </div>
             </label>

             {formData.roles.provider && (
               <div className={styles.subtypeGroup}>
                  <label className={styles.label}>Provider Type</label>
                  <select className={styles.select} value={formData.provider_subtype}
                    onChange={(e) => setFormData({...formData, provider_subtype: e.target.value})} required>
                    <option value="">Select type...</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="freelancer">Freelancer</option>
                    <option value="local_service">Local Service</option>
                  </select>
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
