"use client";

import React, { useState } from "react";
import { Brand } from "../types";
import styles from "./BrandCard.module.css";

interface BrandCardProps {
  brand: Brand;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
}

export default function BrandCard({
  brand,
  onDelete,
  onToggleVisibility,
  onEdit,
}: BrandCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to extract initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Determine rating style
  const getRatingClass = (score: number) => {
    if (score >= 9.0) {
      return styles.scoreExcellent;
    } else if (score >= 8.0) {
      return styles.scoreGood;
    } else if (score >= 7.0) {
      return styles.scoreAverage;
    } else {
      return styles.scorePoor;
    }
  };

  const ratingClass = getRatingClass(brand.score);
  const isHidden = !brand.visibility;

  const handleDeleteClick = () => {
    if (isDeleting) {
      onDelete(brand.id);
    } else {
      setIsDeleting(true);
      // Reset confirmation state after 3 seconds if not clicked again
      setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  return (
    <div
      className={`${styles.card} ${
        brand.type === "casino" ? styles.cardCasino : styles.cardSportsbook
      } ${isHidden ? styles.hiddenCard : ""} animate-scale-up`}
    >
      {/* Card Header */}
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          {brand.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={brand.logo}
              alt={`${brand.name} logo`}
              className={styles.logo}
              onError={(e) => {
                // Fail-safe if image source is broken
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className={`${styles.logoFallback} ${
                brand.type === "casino"
                  ? styles.fallbackCasino
                  : styles.fallbackSportsbook
              }`}
            >
              {getInitials(brand.name)}
            </div>
          )}
          <div>
            <h3 className={styles.name}>{brand.name}</h3>
            <div className={styles.badgeGroup}>
              <span
                className={`${styles.typeBadge} ${
                  brand.type === "casino"
                    ? styles.typeCasino
                    : styles.typeSportsbook
                }`}
              >
                {brand.type}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.badgeGroup}>
          <span
            className={`${styles.statusBadge} ${
              isHidden ? styles.statusHidden : styles.statusVisible
            }`}
          >
            <span className={styles.pulseDot} />
            {isHidden ? "Hidden" : "Visible"}
          </span>
        </div>
      </div>

      {/* Welcome Offer Panel */}
      <div className={styles.offerSection}>
        <div className={styles.offerTitle}>Welcome Offer</div>
        <div className={styles.offerContent}>{brand.welcomeOffer}</div>
      </div>

      {/* Details Row: Rating & Locations */}
      <div className={styles.detailsRow}>
        {/* Rating Score */}
        <div className={styles.scoreContainer}>
          <div className={`${styles.scoreCircle} ${ratingClass}`}>
            {brand.score.toFixed(1)}
          </div>
          <div className={styles.scoreLabel}>
            <span className={styles.scoreVal}>{brand.score.toFixed(1)} Rating</span>
          </div>
        </div>

        {/* Locations */}
        <div className={styles.locationsContainer}>
          <div className={styles.locTitle}>Locations</div>
          <div className={styles.locPills}>
            {brand.locations.slice(0, 3).map((loc, index) => (
              <span key={`${loc}-${index}`} className={styles.locPill}>
                {loc}
              </span>
            ))}
            {brand.locations.length > 3 && (
              <span
                className={styles.locPillMore}
                title={brand.locations.slice(3).join(', ')}
              >
                +{brand.locations.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className={styles.cardFooter}>
        <button
          onClick={() => onEdit(brand.id)}
          className={styles.editBtn}
          title="Edit"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>

        <button
          onClick={() => onToggleVisibility(brand.id)}
          className={styles.toggleVisibilityBtn}
          title={isHidden ? "Show" : "Hide"}
        >
          {isHidden ? (
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Show
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              Hide
            </span>
          )}
        </button>

        <button
          onClick={handleDeleteClick}
          className={styles.deleteBtn}
          style={isDeleting ? { background: "var(--accent-danger)", color: "#ffffff" } : {}}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          {isDeleting ? "Confirm?" : "Remove"}
        </button>
      </div>
    </div>
  );
}
