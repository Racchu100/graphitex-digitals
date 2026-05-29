import React from "react";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main style={{ minHeight: "calc(100vh - var(--header-height) - 300px)" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
