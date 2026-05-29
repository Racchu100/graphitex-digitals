import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/layout/Logo";
import styles from "./AdminNav.module.css";
import {
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  Users,
  Megaphone,
  User,
  FolderOpen,
  Settings,
  ClipboardList,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/approvals", label: "Approvals", Icon: CheckSquare },
  { href: "/admin/business-profiles", label: "Businesses", Icon: Briefcase },
  { href: "/admin/influencers", label: "Influencers", Icon: User },
  { href: "/admin/opportunities", label: "Opportunities", Icon: Megaphone },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/categories", label: "Categories", Icon: FolderOpen },
  { href: "/admin/config", label: "Config", Icon: Settings },
  { href: "/admin/audit-log", label: "Audit Log", Icon: ClipboardList },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <Logo height={24} />
          <span style={{ 
            fontSize: "11px", 
            fontWeight: "bold", 
            background: "var(--color-primary-subtle, rgba(136, 36, 238, 0.1))", 
            color: "var(--color-primary, hsl(262, 70%, 45%))",
            padding: "2px 6px",
            borderRadius: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>Admin</span>
        </Link>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ href, label, Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.link} ${isActive ? styles.active : ""}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <Link href="/" className={styles.backLink}>← Back to Site</Link>
      </div>
    </aside>
  );
}
