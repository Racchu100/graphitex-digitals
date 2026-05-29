"use client";

import React from "react";
import AdminNav from "@/components/admin/AdminNav";
import styles from "./layout.module.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <AdminNav />
      <div className={styles.content}>
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
