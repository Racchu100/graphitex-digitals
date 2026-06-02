"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export default function NewOpportunityPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [businesses, setBusinesses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    business_profile_id: "",
    title: "",
    purpose: "",
    description: "",
    price_min: "",
    price_max: "",
    min_followers: "0",
    platform_preference: "any",
    duration_days: "30"
  });

  useEffect(() => {
    async function fetchBusinesses() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('business_profiles')
        .select('id, business_name')
        .eq('user_id', user.id)
        .eq('status', 'approved'); // Only approved businesses can post

      if (data && data.length > 0) {
        setBusinesses(data);
        setFormData(f => ({ ...f, business_profile_id: data[0].id }));
      }
    }
    fetchBusinesses();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'active') => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");

      if (!formData.business_profile_id) throw new Error("You must select an approved business profile.");

      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(startsAt.getDate() + parseInt(formData.duration_days));

      const payload = {
        business_profile_id: formData.business_profile_id,
        posted_by_user_id: user.id,
        title: formData.title,
        purpose: formData.purpose,
        description: formData.description,
        price_min: parseFloat(formData.price_min),
        price_max: parseFloat(formData.price_max),
        currency: 'INR',
        min_followers: parseInt(formData.min_followers),
        platform_preference: formData.platform_preference,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: status
      };

      const { error: insertError } = await supabase
        .from('opportunities')
        .insert(payload);

      if (insertError) throw insertError;

      router.push('/dashboard/opportunities');
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setLoading(false);
    }
  };

  if (businesses.length === 0 && !loading) {
     return <div style={{ padding: 20 }}>You need an approved business profile to post an opportunity.</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--space-6)' }}>Post Opportunity</h1>
      <Card padding="lg">
        {error && <div style={{ color: 'var(--color-error)', marginBottom: 'var(--space-4)' }}>{error}</div>}
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
           <div>
             <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Select Business Profile *</label>
             <select 
                name="business_profile_id" 
                value={formData.business_profile_id} 
                onChange={handleChange}
                style={{ width: '100%', padding: 'var(--space-3)', marginTop: 4, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}
                required
             >
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.business_name}</option>
                ))}
             </select>
           </div>

           <Input label="Title *" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g. Need food vlogger for cafe launch" />
           <Input label="Purpose *" name="purpose" value={formData.purpose} onChange={handleChange} required placeholder="e.g. Drive footfall on opening weekend" />
           
           <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Description *</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                required 
                rows={5}
                style={{ width: '100%', padding: 'var(--space-3)', marginTop: 4, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}
              />
           </div>

           <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
             <Input label="Min Price (INR) *" name="price_min" type="number" value={formData.price_min} onChange={handleChange} required />
             <Input label="Max Price (INR) *" name="price_max" type="number" value={formData.price_max} onChange={handleChange} required />
           </div>

           <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
             <Input label="Min Followers" name="min_followers" type="number" value={formData.min_followers} onChange={handleChange} />
             <div style={{ flex: 1 }}>
                <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Platform Preference</label>
                <select 
                  name="platform_preference" 
                  value={formData.platform_preference} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: 'var(--space-3)', marginTop: 4, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}
                >
                   <option value="any">Any</option>
                   <option value="instagram">Instagram</option>
                </select>
             </div>
           </div>

           <div>
              <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>Duration (Days)</label>
              <select 
                name="duration_days" 
                value={formData.duration_days} 
                onChange={handleChange}
                style={{ width: '100%', padding: 'var(--space-3)', marginTop: 4, borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)' }}
              >
                 <option value="7">1 Week</option>
                 <option value="14">2 Weeks</option>
                 <option value="30">1 Month (Max)</option>
              </select>
           </div>

           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
              <Button type="button" variant="outline" onClick={(e) => handleSubmit(e, 'draft')} loading={loading}>Save Draft</Button>
              <Button type="button" onClick={(e) => handleSubmit(e, 'active')} loading={loading}>Publish Now</Button>
           </div>
        </form>
      </Card>
    </div>
  );
}
