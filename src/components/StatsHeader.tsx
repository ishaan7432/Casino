"use client";

import React from "react";
import { Brand } from "../types";
import styles from "./StatsHeader.module.css";

interface StatsHeaderProps {
  brands: Brand[];
}

export default function StatsHeader({ brands }: StatsHeaderProps) {
  const totalBrands = brands.length;

  const visibleCasinos = brands.filter((b) => b.type === "casino" && !b.data.hidden).length;
  const visibleSportsbooks = brands.filter((b) => b.type === "sportsbook" && !b.data.hidden).length;
  const totalCasinos = brands.filter((b) => b.type === "casino").length;
  const totalSportsbooks = brands.filter((b) => b.type === "sportsbook").length;
  const hiddenCount = brands.filter((b) => b.data.hidden).length;

  return (
    <div className={styles.grid}>
      <div className={`${styles.card} ${styles.cardTotal}`}>
        <div>
          <div className={styles.label}>Total Entries</div>
          <div className={styles.value}>{totalBrands}</div>
        </div>
        <div className={styles.subText}>
          <span className={`${styles.indicator} ${styles.indicatorTotal}`} />
          {totalCasinos} Casinos, {totalSportsbooks} Sportsbooks
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardCasino}`}>
        <div>
          <div className={styles.label}>Visible Casinos</div>
          <div className={styles.value}>{visibleCasinos}</div>
        </div>
        <div className={styles.subText}>
          <span className={`${styles.indicator} ${styles.indicatorCasino}`} />
          {totalCasinos - visibleCasinos} hidden
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardSportsbook}`}>
        <div>
          <div className={styles.label}>Visible Sportsbooks</div>
          <div className={styles.value}>{visibleSportsbooks}</div>
        </div>
        <div className={styles.subText}>
          <span className={`${styles.indicator} ${styles.indicatorSportsbook}`} />
          {totalSportsbooks - visibleSportsbooks} hidden
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardAvg}`}>
        <div>
          <div className={styles.label}>Hidden Total</div>
          <div className={styles.value}>{hiddenCount}</div>
        </div>
        <div className={styles.subText}>
          <span className={`${styles.indicator} ${styles.indicatorAvg}`} />
          Not shown in APIs
        </div>
      </div>
    </div>
  );
}
