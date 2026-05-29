import React from "react";
import DashboardNav from "@/components/layout/DashboardNav";
import NavBar from "@/components/layout/NavBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar />
      <div style={{ display: 'flex', flex: 1 }}>
        <DashboardNav />
        <main style={{ flex: 1, padding: 'var(--dashboard-content-padding, var(--space-8))', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
