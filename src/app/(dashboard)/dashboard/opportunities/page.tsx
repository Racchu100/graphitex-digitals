"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/useUser";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Opportunity } from "@/types/database";
import { Trash2 } from "lucide-react";
import { deleteOpportunity } from "./actions";

export default function ProviderOpportunitiesPage() {
  const supabase = createClient();
  const { user, loading: userLoading } = useUser();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this opportunity?");
    if (!confirmDelete) return;

    try {
      const res = await deleteOpportunity(id);
      if (res?.success) {
        setOpportunities(prev => prev.filter(opp => opp.id !== id));
        alert("Opportunity deleted successfully!");
      }
    } catch (err: any) {
      console.error("Error deleting opportunity:", err);
      alert(err.message || "Failed to delete opportunity.");
    }
  };

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const userId = user.id;

    async function fetchOpps() {
      try {
        const { data, error } = await supabase
          .from('opportunities')
          .select('*, opportunity_applications(id, status)')
          .eq('posted_by_user_id', userId)
          .order('created_at', { ascending: false });

        if (data) {
          setOpportunities(data as any[]);
        }
      } catch (err) {
        console.warn("Failed to fetch opportunities on mount:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOpps();
  }, [user, userLoading, supabase]);

  if (userLoading || loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Loading opportunities...</p>
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
    <div>
      <div className="opp-dashboard-header">
        <h1 className="opp-dashboard-title">My Opportunities</h1>
        <Link href="/dashboard/opportunities/new">
          <Button className="opp-dashboard-post-btn">Post Opportunity</Button>
        </Link>
      </div>

      {opportunities.length === 0 ? (
        <Card padding="lg" style={{ textAlign: 'center' }}>
          <h3>No Opportunities Posted</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
            Create an opportunity to recruit influencers for your services.
          </p>
          <Link href="/dashboard/opportunities/new">
            <Button>Post Opportunity</Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {opportunities.map(opp => {
            const apps = (opp as any).opportunity_applications || [];
            const totalApps = apps.length;
            const pendingApps = apps.filter((app: any) => app.status === 'applied').length;

            return (
              <Card key={opp.id} className="opp-card">
                <div className="opp-card-container">
                  <div className="opp-card-info">
                    <h3 className="opp-card-title">{opp.title}</h3>
                    <p className="opp-card-status">
                      <span>Status: <strong style={{ textTransform: 'capitalize' }}>{opp.status}</strong></span>
                      <span>|</span>
                      <span>Expires: {new Date(opp.expires_at).toLocaleDateString()}</span>
                      <span>|</span>
                      <span>Applications: {totalApps}</span>
                    </p>
                  </div>
                  <div className="opp-card-actions">
                    <Link href={`/dashboard/opportunities/${opp.id}/applications`} style={{ position: 'relative', display: 'inline-flex' }}>
                      <Button variant="outline" size="sm">View Applications</Button>
                      {pendingApps > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: 'hsl(350, 80%, 48%)',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          {pendingApps}
                        </span>
                      )}
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(opp.id)}
                      className="opp-card-delete-btn"
                    >
                      <Trash2 size={14} style={{ marginRight: '6px' }} />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
