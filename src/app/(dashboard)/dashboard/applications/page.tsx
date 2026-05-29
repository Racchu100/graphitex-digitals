"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";
import Card from "@/components/ui/Card";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  applied: { bg: 'var(--color-primary-subtle)', color: 'var(--color-primary)' },
  viewed: { bg: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' },
  contacted: { bg: 'hsl(40 80% 15%)', color: 'hsl(40 90% 60%)' },
  accepted: { bg: 'hsl(140 50% 10%)', color: 'hsl(140 60% 50%)' },
  rejected: { bg: 'hsl(0 50% 15%)', color: 'hsl(0 70% 60%)' },
};

export default function MyApplicationsPage() {
  const supabase = createClient();
  const { user, loading: userLoading } = useUser();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const userId = user.id;

    async function fetchApplications() {
      try {
        // Get influencer profile for current user
        const { data: ip } = await supabase
          .from('influencer_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!ip) {
          return;
        }

        const { data } = await supabase
          .from('opportunity_applications')
          .select(`
            *,
            opportunities (
              id, title, status, expires_at,
              business_profiles (business_name, whatsapp_number, contact_number)
            )
          `)
          .eq('influencer_profile_id', ip.id)
          .order('created_at', { ascending: false });

        if (data) setApplications(data);
      } catch (err) {
        console.warn("Failed to fetch applications on mount:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchApplications();

    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchApplications, 30000);
    return () => clearInterval(interval);
  }, [user, userLoading, supabase]);

  if (userLoading || loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Loading your applications...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center" }}>
        <h3>Access Denied</h3>
        <p style={{ color: "var(--color-text-secondary)" }}>Please log in to view this page.</p>
      </div>
    );
  }


  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>My Applications</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Track the status of opportunities you have applied to.
        </p>
      </div>

      {applications.length === 0 ? (
        <Card padding="lg" style={{ textAlign: 'center' }}>
          <h3>No Applications Yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Browse open opportunities and apply to ones that match your profile.
          </p>
          <Link href="/opportunities" style={{ color: 'var(--color-primary)' }}>
            Browse Opportunities →
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {applications.map((app: any) => {
            const opp = app.opportunities;
            const statusStyle = STATUS_COLORS[app.status] || STATUS_COLORS.applied;

            return (
              <Card key={app.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <div style={{ flex: 1 }}>
                    <Link
                      href={`/opportunities/${opp?.id}`}
                      style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
                    >
                      {opp?.title}
                    </Link>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 'var(--space-1) 0 0' }}>
                      by {opp?.business_profiles?.business_name} · 
                      Applied {new Date(app.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </p>
                    {opp?.status !== 'active' && (
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                        Opportunity {opp?.status}
                      </p>
                    )}
                    {app.status === 'accepted' && (
                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <a
                          href={`https://wa.me/${opp?.business_profiles?.whatsapp_number || opp?.business_profiles?.contact_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'hsl(142, 70%, 45%)',
                            color: '#ffffff',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--weight-semibold)',
                            textDecoration: 'none',
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'opacity 0.15s ease',
                            width: 'fit-content'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                          💬 Contact Business (WhatsApp)
                        </a>
                      </div>
                    )}
                  </div>

                  <span style={{
                    display: 'inline-flex',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--weight-semibold)',
                    textTransform: 'capitalize',
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    whiteSpace: 'nowrap'
                  }}>
                    {app.status === 'accepted' ? 'approved' : app.status}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
