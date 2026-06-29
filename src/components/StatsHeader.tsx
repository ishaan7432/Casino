"use client";

import React from "react";
import { Brand, Casino } from "../types";
import styles from "./StatsHeader.module.css";

interface StatsHeaderProps {
  brands: Brand[];
}

interface StatCardProps {
  label: string;
  visible: number;
  total: number;
  accentClass: string;
  icon: React.ReactNode;
}

function StatCard({ label, visible, total, accentClass, icon }: StatCardProps) {
  const hidden = total - visible;
  const pct = total > 0 ? Math.round((visible / total) * 100) : 0;

  return (
    <div className={`${styles.card} ${accentClass}`}>
      <div className={styles.cardTop}>
        <div className={styles.iconWrap}>{icon}</div>
        <div className={styles.labelRow}>
          <span className={styles.label}>{label}</span>
        </div>
      </div>

      <div className={styles.counts}>
        <span className={styles.bigNum}>{visible}</span>
        <span className={styles.ofTotal}>/ {total}</span>
      </div>

      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${pct}%` }} />
      </div>

      <div className={styles.badges}>
        <span className={styles.badgeVisible}>
          <span className={styles.dot} />
          {visible} visible
        </span>
        <span className={styles.badgeHidden}>
          <span className={`${styles.dot} ${styles.dotHidden}`} />
          {hidden} hidden
        </span>
      </div>
    </div>
  );
}

export default function StatsHeader({ brands }: StatsHeaderProps) {
  const totalSportsbooks = brands.filter((b) => b.type === "sportsbook").length;
  const visibleSportsbooks = brands.filter((b) => b.type === "sportsbook" && !b.data.hidden).length;

  const totalCasinos = brands.filter((b) => b.type === "casino" && !(b.data as Casino).social_casino).length;
  const visibleCasinos = brands.filter((b) => b.type === "casino" && !(b.data as Casino).social_casino && !b.data.hidden).length;

  const totalSocial = brands.filter((b) => b.type === "casino" && (b.data as Casino).social_casino).length;
  const visibleSocial = brands.filter((b) => b.type === "casino" && (b.data as Casino).social_casino && !b.data.hidden).length;

  const totalAll = brands.length;
  const visibleAll = brands.filter((b) => !b.data.hidden).length;

  return (
    <div className={styles.grid}>
      <StatCard
        label="All Entries"
        visible={visibleAll}
        total={totalAll}
        accentClass={styles.cardTotal}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
        }
      />
      <StatCard
        label="Sportsbooks"
        visible={visibleSportsbooks}
        total={totalSportsbooks}
        accentClass={styles.cardSportsbook}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
        }
      />
      <StatCard
        label="Casinos"
        visible={visibleCasinos}
        total={totalCasinos}
        accentClass={styles.cardCasino}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        }
      />
      <StatCard
        label="Social Casinos"
        visible={visibleSocial}
        total={totalSocial}
        accentClass={styles.cardSocial}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        }
      />
    </div>
  );
}
