import React from "react";
import Link from "next/link";
import styles from "./AdminTable.module.css";

interface AdminTableProps {
  columns: string[];
  rows: Record<string, any>[];
}

export default function AdminTable({ columns, rows }: AdminTableProps) {
  if (rows.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No records found.</p>
      </div>
    );
  }

  const keys = Object.keys(rows[0]);

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col} className={styles.th}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={styles.tr}>
              {keys.map(key => (
                key === "actions" ? (
                  <td key={key} className={styles.td}>
                    <Link href={row[key]} className={styles.actionLink}>View →</Link>
                  </td>
                ) : key === "status" ? (
                  <td key={key} className={styles.td}>
                    <span className={`${styles.badge} ${styles[`status_${row[key]}`]}`}>
                      {row[key]}
                    </span>
                  </td>
                ) : (
                  <td key={key} className={styles.td}>{row[key]}</td>
                )
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
