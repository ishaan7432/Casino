"use client";

import React from "react";
import { Brand } from "../types";
import styles from "./StatsHeader.module.css";

interface StatsHeaderProps {
  brands: Brand[];
}

export default function StatsHeader({ brands }: StatsHeaderProps) {
  const totalBrands = brands.length;
  
  const activeCasinos = brands.filter(
    (b) => b.type === "casino" && b.visibility === true
  ).length;

  const activeSportsbooks = brands.filter(
    (b) => b.type === "sportsbook" && b.visibility === true
  ).length;

  const totalCasinos = brands.filter((b) => b.type === "casino").length;
  const totalSportsbooks = brands.filter((b) => b.type === "sportsbook").length;
  
  const averageScore = brands.length
    ? (brands.reduce((acc, curr) => acc + curr.score, 0) / brands.length).toFixed(1)
    : "0.0";

  return (
    <div className={styles.grid}>
      <div className={`${styles.card} ${styles.cardTotal}`}>
        <div>
          <div className={styles.label}>Total Offers</div>
          <div className={styles.value}>{totalBrands}</div>
        </div>
        <div className={styles.subText}>
          <span className={`${styles.indicator} ${styles.indicatorTotal}`} />
          {totalCasinos} Casinos, {totalSportsbooks} Sportsbooks
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardCasino}`}>
        <div>
          <div className={styles.label}>Active Casinos</div>
          <div className={styles.value}>{activeCasinos}</div>
        </div>
        <div className={styles.subText}>
          <span className={`${styles.indicator} ${styles.indicatorCasino}`} />
          Live & visible on frontend
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardSportsbook}`}>
        <div>
          <div className={styles.label}>Active Sportsbooks</div>
          <div className={styles.value}>{activeSportsbooks}</div>
        </div>
        <div className={styles.subText}>
          <span className={`${styles.indicator} ${styles.indicatorSportsbook}`} />
          Live & visible on frontend
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardAvg}`}>
        <div>
          <div className={styles.label}>Average Rating</div>
          <div className={styles.value}>{averageScore} <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>/10</span></div>
        </div>
        <div className={styles.subText}>
          <span className={`${styles.indicator} ${styles.indicatorAvg}`} />
          Overall rating average
        </div>
      </div>
    </div>
  );
}
