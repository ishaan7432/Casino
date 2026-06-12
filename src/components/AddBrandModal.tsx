"use client";

import React, { useState, useRef } from "react";
import { Brand } from "../types";
import styles from "./AddBrandModal.module.css";

interface AddBrandModalProps {
  onClose: () => void;
  onAdd: (brand: Omit<Brand, "id" | "createdAt">) => void;
}

const POPULAR_LOCATIONS = [
  { code: "US", name: "USA" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "UK" },
  { code: "DE", name: "Germany" },
  { code: "AU", name: "Australia" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
];

export default function AddBrandModal({ onClose, onAdd }: AddBrandModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"casino" | "sportsbook">("casino");
  const [logoType, setLogoType] = useState<"upload" | "url">("upload");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [welcomeOffer, setWelcomeOffer] = useState("");
  const [score, setScore] = useState(8.5);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(["US", "CA"]);
  const [customLocations, setCustomLocations] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File to base64 converter
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, logo: "File is too large (max 2MB)" }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoBase64(reader.result as string);
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.logo;
          return copy;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationToggle = (code: string) => {
    setSelectedLocations((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Brand name is required";
    if (!welcomeOffer.trim()) newErrors.welcomeOffer = "Welcome offer description is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Process locations
    let finalLocations = [...selectedLocations];
    if (customLocations.trim()) {
      const customs = customLocations
        .split(",")
        .map((loc) => loc.trim().toUpperCase())
        .filter((loc) => loc.length > 0 && !finalLocations.includes(loc));
      finalLocations = [...finalLocations, ...customs];
    }

    if (finalLocations.length === 0) {
      setErrors({ locations: "Please select or type at least one location" });
      return;
    }

    // Determine final logo
    const finalLogo = logoType === "url" ? logoUrl : logoBase64;

    onAdd({
      name: name.trim(),
      type,
      logo: finalLogo,
      welcomeOffer: welcomeOffer.trim(),
      score,
      locations: finalLocations,
      visibility: isVisible ? "visible" : "hidden",
    });
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${
          type === "casino" ? styles.casinoTheme : styles.sportsbookTheme
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Add New Brand</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* Row 1: Name and Type */}
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Brand Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Grand Palace"
                className={styles.input}
              />
              {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Operator Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "casino" | "sportsbook")}
                className={styles.select}
              >
                <option value="casino">🎰 Casino</option>
                <option value="sportsbook">⚽ Sportsbook</option>
              </select>
            </div>
          </div>

          {/* Row 2: Welcome Offer */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Welcome Offer</label>
            <input
              type="text"
              value={welcomeOffer}
              onChange={(e) => setWelcomeOffer(e.target.value)}
              placeholder="E.g., 100% Match up to $1,000 + 100 Free Spins"
              className={styles.input}
            />
            {errors.welcomeOffer && (
              <span className={styles.errorMsg}>{errors.welcomeOffer}</span>
            )}
          </div>

          {/* Row 3: Logo Source and Selector */}
          <div className={styles.formGroup}>
            <label className={styles.label} style={{ marginBottom: "12px" }}>
              Brand Logo
            </label>
            
            <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
              <label className={styles.checkboxLabel}>
                <input
                  type="radio"
                  name="logoSource"
                  checked={logoType === "upload"}
                  onChange={() => setLogoType("upload")}
                  style={{ accentColor: "var(--modal-accent)" }}
                />
                Upload File
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="radio"
                  name="logoSource"
                  checked={logoType === "url"}
                  onChange={() => setLogoType("url")}
                  style={{ accentColor: "var(--modal-accent)" }}
                />
                Image URL
              </label>
            </div>

            {logoType === "upload" ? (
              <div>
                {!logoBase64 ? (
                  <div
                    className={styles.uploadZone}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.uploadIcon}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className={styles.uploadText}>
                      Click to upload logo image
                    </span>
                    <span className={styles.uploadSubtext}>
                      PNG, JPG up to 2MB (fallback initials used if empty)
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                  </div>
                ) : (
                  <div className={styles.logoPreviewContainer}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoBase64}
                      alt="Logo preview"
                      className={styles.logoPreview}
                    />
                    <button
                      type="button"
                      onClick={() => setLogoBase64("")}
                      className={styles.removeLogoBtn}
                    >
                      Remove
                    </button>
                  </div>
                )}
                {errors.logo && <span className={styles.errorMsg}>{errors.logo}</span>}
              </div>
            ) : (
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="E.g., https://example.com/logo.png"
                className={styles.input}
              />
            )}
          </div>

          {/* Row 4: Score Rating */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Rating Score</label>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={score}
                onChange={(e) => setScore(parseFloat(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.sliderValue}>{score.toFixed(1)}</span>
            </div>
          </div>

          {/* Row 5: Locations */}
          <div className={styles.formGroup}>
            <label className={styles.label} style={{ marginBottom: "6px" }}>
              Target Locations
            </label>
            <div className={styles.checkboxGrid}>
              {POPULAR_LOCATIONS.map((loc) => (
                <label key={loc.code} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedLocations.includes(loc.code)}
                    onChange={() => handleLocationToggle(loc.code)}
                    className={styles.checkboxInput}
                  />
                  {loc.code} ({loc.name})
                </label>
              ))}
            </div>
            
            <div style={{ marginTop: "12px" }}>
              <label className={styles.label} style={{ fontSize: "0.75rem" }}>
                Add Custom Locations (comma separated)
              </label>
              <input
                type="text"
                value={customLocations}
                onChange={(e) => setCustomLocations(e.target.value)}
                placeholder="E.g., IE, NZ, ZA"
                className={styles.input}
                style={{ marginTop: "4px" }}
              />
            </div>
            {errors.locations && (
              <span className={styles.errorMsg}>{errors.locations}</span>
            )}
          </div>

          {/* Row 6: Visibility */}
          <div className={styles.formGroup} style={{ marginBottom: "10px" }}>
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>
                <span className={styles.toggleLabelTitle}>Visible Status</span>
                <span className={styles.toggleLabelDesc}>
                  Publish this brand to the active listing immediately
                </span>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                />
                <span className={styles.sliderToggle} />
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn}>
              Add Brand
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
