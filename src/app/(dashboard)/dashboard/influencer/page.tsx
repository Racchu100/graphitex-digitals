"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardInfluencerPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/dashboard/profile?tab=influencer");
  }, [router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
      <p style={{ color: "var(--color-text-secondary)" }}>Redirecting to your influencer settings...</p>
    </div>
  );
}
