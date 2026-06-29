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
  const isSocial = !isSportsbook && !!casino?.social_casino;

  const name = isSportsbook ? sb!.sportsbook_name : casino!.display_name;
  const logo = isSportsbook ? (sb!.square_logo_url || sb!.logo_url) : (casino!.square_logo_url || casino!.logo_url);
  const link = isSportsbook ? sb!.link : casino!.link;
  const promoCode = isSportsbook ? sb!.promo_code : casino!.promo_code;
  const isHidden = brand.data.hidden;
  const isBusy = loadingAction !== null;

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

  return (
    <div className={`${styles.card} ${isSportsbook ? styles.cardSportsbook : styles.cardCasino} ${isHidden ? styles.hiddenCard : ""}`}>

      {isBusy && <div className={styles.loadingOverlay}><span className={styles.spinner} /></div>}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          {logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logo} alt={name} className={styles.logo} onError={(e) => { (e.target as HTMLElement).style.display = "none"; }} />
          ) : (
            <div className={`${styles.logoFallback} ${isSportsbook ? styles.fallbackSportsbook : styles.fallbackCasino}`}>
              {getInitials(name)}
            </div>
          )}
          <div className={styles.nameBlock}>
            <h3 className={styles.name} title={name}>{name}</h3>
            <div className={styles.typeBadgeGroup}>
              <span className={`${styles.typeBadge} ${isSportsbook ? styles.typeSportsbook : styles.typeCasino}`}>
                {isSportsbook ? "Sportsbook" : "Casino"}
              </span>
              {isSocial && <span className={`${styles.typeBadge} ${styles.typeSocial}`}>Social</span>}
            </div>
          </div>
        </div>

        <span className={`${styles.statusBadge} ${isHidden ? styles.statusHidden : styles.statusVisible}`}>
          <span className={styles.pulseDot} />
          {isHidden ? "Hidden" : "Live"}
        </span>
      </div>

      {/* Info rows */}
      <div className={styles.infoSection}>
        {promoCode && (
          <div className={styles.infoRow}>
            <svg className={styles.infoIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <span className={styles.infoValue}>{promoCode}</span>
          </div>
        )}
        {link && (
          <div className={styles.infoRow}>
            <svg className={styles.infoIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <a href={link} target="_blank" rel="noopener noreferrer" className={styles.infoLink} title={link}>{link}</a>
          </div>
        )}
        {!promoCode && !link && (
          <div className={styles.infoRow}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>No promo or link set</span>
          </div>
        )}
      </div>

      {/* Meta: order + provinces */}
      <div className={styles.metaRow}>
        <span className={styles.orderBadge}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          #{brand.data.display_order}
        </span>

        <div className={styles.locWrap}>
          {provinces.length === 0
            ? <span className={styles.locPillAll}>No provinces</span>
            : <>
                {provinces.slice(0, 3).map((loc, i) => (
                  <span key={`${loc}-${i}`} className={styles.locPill}>{loc}</span>
                ))}
                {provinces.length > 3 && (
                  <span className={styles.locPillMore} title={provinces.slice(3).join(", ")}>
                    +{provinces.length - 3}
                  </span>
                )}
              </>
          }
        </div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <button onClick={() => onEdit(brand.id)} className={styles.editBtn} disabled={isBusy}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>

        <button onClick={handleToggle} className={styles.toggleVisibilityBtn} disabled={isBusy}>
          {loadingAction === "visibility" ? <span className={styles.btnSpinner} /> : isHidden ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              Show
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              Hide
            </>
          )}
        </button>

        <button
          onClick={handleDeleteClick}
          className={styles.deleteBtn}
          disabled={isBusy}
          style={isDeleting && !isBusy ? { background: "#f43f5e", borderColor: "#f43f5e", color: "#fff" } : {}}
        >
          {loadingAction === "delete" ? <span className={styles.btnSpinner} /> : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
