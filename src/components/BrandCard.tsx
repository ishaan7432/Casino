"use client";

import { useState } from "react";
import { Brand, Sportsbook, Casino } from "../types";
import styles from "./BrandCard.module.css";

interface BrandCardProps {
  brand: Brand;
  provinces: string[];
  onDelete: (id: string) => Promise<void>;
  onToggleVisibility: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
}

export default function BrandCard({ brand, provinces, onDelete, onToggleVisibility, onEdit }: BrandCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"visibility" | "delete" | null>(null);

  const isSportsbook = brand.type === "sportsbook";
  const sb = isSportsbook ? (brand.data as Sportsbook) : null;
  const casino = !isSportsbook ? (brand.data as Casino) : null;

  const name = isSportsbook ? sb!.sportsbook_name : casino!.display_name;
  const logo = isSportsbook ? (sb!.square_logo_url || sb!.logo_url) : (casino!.square_logo_url || casino!.logo_url);
  const link = isSportsbook ? sb!.link : casino!.link;
  const promoCode = isSportsbook ? sb!.promo_code : casino!.promo_code;
  const locations = provinces;
  const isHidden = brand.data.hidden;

  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
  };

  const handleToggle = async () => {
    if (loadingAction) return;
    setLoadingAction("visibility");
    await onToggleVisibility(brand.id);
    setLoadingAction(null);
  };

  const handleDeleteClick = async () => {
    if (loadingAction) return;
    if (isDeleting) {
      setLoadingAction("delete");
      await onDelete(brand.id);
      setLoadingAction(null);
    } else {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  const isBusy = loadingAction !== null;

  return (
    <div className={`${styles.card} ${isSportsbook ? styles.cardSportsbook : styles.cardCasino} ${isHidden ? styles.hiddenCard : ""} animate-scale-up`}>

      {/* Loading overlay */}
      {isBusy && <div className={styles.loadingOverlay}><span className={styles.spinner} /></div>}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          {logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logo} alt={`${name} logo`} className={styles.logo} onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
          ) : (
            <div className={`${styles.logoFallback} ${isSportsbook ? styles.fallbackSportsbook : styles.fallbackCasino}`}>
              {getInitials(name)}
            </div>
          )}
          <div>
            <h3 className={styles.name}>{name}</h3>
            <div className={styles.typeBadgeGroup}>
              <span className={`${styles.typeBadge} ${isSportsbook ? styles.typeSportsbook : styles.typeCasino}`}>
                {brand.type}
              </span>
              {!isSportsbook && (brand.data as Casino).social_casino && (
                <span className={styles.typeBadge} style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)", marginLeft: 4 }}>Social</span>
              )}
            </div>
          </div>
        </div>

        <span className={`${styles.statusBadge} ${isHidden ? styles.statusHidden : styles.statusVisible}`}>
          <span className={styles.pulseDot} />
          {isHidden ? "Hidden" : "Visible"}
        </span>
      </div>

      {/* Details */}
      <div className={styles.offerSection}>
        {promoCode && (
          <div className={styles.offerContent}>
            <strong>Promo:</strong> {promoCode}
          </div>
        )}
        {link && (
          <div className={styles.offerContent} style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
            <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)" }}>{link}</a>
          </div>
        )}
      </div>

      {/* Order + Locations */}
      <div className={styles.detailsRow}>
        <div className={styles.scoreContainer}>
          <div className={styles.scoreCircle} style={{ fontSize: "1rem", minWidth: 40 }}>
            #{brand.data.display_order}
          </div>
          <div className={styles.scoreLabel}>
            <span className={styles.scoreVal}>Display Order</span>
          </div>
        </div>

        <div className={styles.locationsContainer}>
          <div className={styles.locTitle}>Locations</div>
          <div className={styles.locPills}>
            {locations.length === 0 && <span className={styles.locPill} style={{ opacity: 0.5 }}>All</span>}
            {locations.slice(0, 3).map((loc, i) => (
              <span key={`${loc}-${i}`} className={styles.locPill}>{loc}</span>
            ))}
            {locations.length > 3 && (
              <span className={styles.locPillMore} title={locations.slice(3).join(", ")}>
                +{locations.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className={styles.cardFooter}>
        <button onClick={() => onEdit(brand.id)} className={styles.editBtn} disabled={isBusy} title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>

        <button onClick={handleToggle} className={styles.toggleVisibilityBtn} disabled={isBusy} title={isHidden ? "Show" : "Hide"}>
          {loadingAction === "visibility" ? (
            <span className={styles.btnSpinner} />
          ) : isHidden ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              Show
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          disabled={isBusy}
          style={isDeleting && !isBusy ? { background: "var(--accent-danger)", color: "#ffffff" } : {}}
        >
          {loadingAction === "delete" ? (
            <span className={styles.btnSpinner} />
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              {isDeleting ? "Confirm?" : "Delete"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
