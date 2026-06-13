"use client";

import React, { useState, useRef, useEffect } from "react";
import { Brand } from "../types";
import { sportsbooksApi, casinosApi, Sportsbook, Casino } from "../lib/api";
import styles from "./AddBrandModal.module.css";

interface AddBrandModalProps {
  onClose: () => void;
  onAdd: (brand: Omit<Brand, "id" | "createdAt">) => void;
  editBrand?: Brand | null;
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const CANADA_PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
  "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"
];

export default function AddBrandModal({ onClose, onAdd, editBrand }: AddBrandModalProps) {
  const isEditMode = !!editBrand;

  const [name, setName] = useState(editBrand?.name || "");
  const [type, setType] = useState<"casino" | "sportsbook">(editBrand?.type || "casino");
  const [logoType, setLogoType] = useState<"upload" | "url" | "existing">(
    isEditMode && editBrand?.logo ? "url" : "upload"
  );
  const [logoUrl, setLogoUrl] = useState(editBrand?.logo || "");
  const [logoBase64, setLogoBase64] = useState("");
  const [welcomeOffer, setWelcomeOffer] = useState(editBrand?.welcomeOffer || "");
  const [score, setScore] = useState(editBrand?.score || 8.5);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(editBrand?.locations || []);
  const [isVisible, setIsVisible] = useState(editBrand?.visibility !== false);

  // Location selection
  const [selectedCountry, setSelectedCountry] = useState<"" | "United States" | "Canada">("");
  const [selectedProvince, setSelectedProvince] = useState("");

  // Sportsbooks/Casinos state
  const [sportsbooks, setSportsbooks] = useState<Sportsbook[]>([]);
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [selectedSportsbook, setSelectedSportsbook] = useState<Sportsbook | null>(null);
  const [selectedCasino, setSelectedCasino] = useState<Casino | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSportsbooks = async () => {
    setLoadingOptions(true);
    try {
      const response = await sportsbooksApi.list();
      setSportsbooks(response.data || []);
    } catch (error) {
      console.error("Failed to fetch sportsbooks:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchCasinos = async () => {
    setLoadingOptions(true);
    try {
      const response = await casinosApi.list();
      setCasinos(response.data || []);
    } catch (error) {
      console.error("Failed to fetch casinos:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Fetch sportsbooks or casinos when type changes
  useEffect(() => {
    const handler = setTimeout(() => {
      if (type === "sportsbook") {
        fetchSportsbooks();
      } else {
        fetchCasinos();
      }
    }, 0);
    return () => clearTimeout(handler);
  }, [type]);

  const handleSportsbookSelect = (sportsbook: Sportsbook) => {
    setSelectedSportsbook(sportsbook);
    setName(sportsbook.sportsbook_name);
    setLogoType("existing");
  };

  const handleCasinoSelect = (casino: Casino) => {
    setSelectedCasino(casino);
    setName(casino.display_name);
    setLogoType("existing");
  };

  const handleAddLocation = () => {
    if (selectedCountry && selectedProvince) {
      const location = selectedProvince;
      if (!selectedLocations.includes(location)) {
        setSelectedLocations([...selectedLocations, location]);
      }
      setSelectedProvince("");
    }
  };

  const handleRemoveLocation = (location: string) => {
    setSelectedLocations(selectedLocations.filter(loc => loc !== location));
  };

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
      setLogoType("upload");
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Brand name is required";
    if (!welcomeOffer.trim()) newErrors.welcomeOffer = "Welcome offer is required";
    if (score < 0 || score > 10) newErrors.score = "Score must be between 0 and 10";

    if (logoType === "upload" && !logoBase64) {
      newErrors.logo = "Please upload a logo file";
    } else if (logoType === "url" && !logoUrl.trim()) {
      newErrors.logo = "Please provide a logo URL";
    } else if (logoType === "existing") {
      if (type === "sportsbook" && !selectedSportsbook) {
        newErrors.logo = "Please select a sportsbook";
      } else if (type === "casino" && !selectedCasino) {
        newErrors.logo = "Please select a casino";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    let finalLogo = "";
    if (logoType === "upload") {
      finalLogo = logoBase64;
    } else if (logoType === "url") {
      finalLogo = logoUrl;
    } else if (logoType === "existing") {
      if (type === "sportsbook" && selectedSportsbook) {
        finalLogo = selectedSportsbook.square_logo_url || selectedSportsbook.logo_url || "";
      } else if (type === "casino" && selectedCasino) {
        finalLogo = selectedCasino.square_logo_url || selectedCasino.logo_url || "";
      }
    }

    const newBrand: Omit<Brand, "id" | "createdAt"> = {
      name: name.trim(),
      type,
      logo: finalLogo,
      welcomeOffer: welcomeOffer.trim(),
      score: Number(score),
      locations: selectedLocations,
      visibility: isVisible,
    };

    onAdd(newBrand);
    onClose();
  };

  const getProvinceOptions = () => {
    if (selectedCountry === "United States") return US_STATES;
    if (selectedCountry === "Canada") return CANADA_PROVINCES;
    return [];
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${
          type === "casino" ? styles.casinoTheme : styles.sportsbookTheme
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditMode ? "Edit Offer" : "Add New Offer"}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {/* Operator Type */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Offer Type</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="type"
                  checked={type === "casino"}
                  onChange={() => setType("casino")}
                  disabled={isEditMode}
                />
                <span>Casino</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="type"
                  checked={type === "sportsbook"}
                  onChange={() => setType("sportsbook")}
                  disabled={isEditMode}
                />
                <span>Sportsbook</span>
              </label>
            </div>
          </div>

          {/* Logo Source Selection */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Logo Source</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="logoType"
                  checked={logoType === "existing"}
                  onChange={() => setLogoType("existing")}
                />
                <span>Select Existing</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="logoType"
                  checked={logoType === "url"}
                  onChange={() => setLogoType("url")}
                />
                <span>URL</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="logoType"
                  checked={logoType === "upload"}
                  onChange={() => setLogoType("upload")}
                />
                <span>Upload</span>
              </label>
            </div>
          </div>

          {/* Existing Logo Selection - Sportsbook */}
          {logoType === "existing" && type === "sportsbook" && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Sportsbook (Name & Logo)</label>
              {loadingOptions ? (
                <p className={styles.loading}>Loading sportsbooks...</p>
              ) : (
                <>
                  <select
                    className={styles.input}
                    value={selectedSportsbook?.id?.toString() || ""}
                    onChange={(e) => {
                      const sb = sportsbooks.find(s => s.id.toString() === e.target.value);
                      if (sb) handleSportsbookSelect(sb);
                    }}
                  >
                    <option value="">Choose a sportsbook...</option>
                    {sportsbooks.map((sb) => (
                      <option key={sb.id} value={sb.id.toString()}>
                        {sb.sportsbook_name}
                      </option>
                    ))}
                  </select>
                  {selectedSportsbook && selectedSportsbook.square_logo_url && (
                    <div className={styles.logoPreview}>
                      <img src={selectedSportsbook.square_logo_url} alt={selectedSportsbook.sportsbook_name} />
                      <span className={styles.logoPreviewText}>{selectedSportsbook.sportsbook_name}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Existing Logo Selection - Casino */}
          {logoType === "existing" && type === "casino" && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Casino (Name & Logo)</label>
              {loadingOptions ? (
                <p className={styles.loading}>Loading casinos...</p>
              ) : (
                <>
                  <select
                    className={styles.input}
                    value={selectedCasino?.id?.toString() || ""}
                    onChange={(e) => {
                      const casino = casinos.find(c => c.id.toString() === e.target.value);
                      if (casino) handleCasinoSelect(casino);
                    }}
                  >
                    <option value="">Choose a casino...</option>
                    {casinos.map((casino) => (
                      <option key={casino.id} value={casino.id.toString()}>
                        {casino.display_name}
                      </option>
                    ))}
                  </select>
                  {selectedCasino && selectedCasino.square_logo_url && (
                    <div className={styles.logoPreview}>
                      <img src={selectedCasino.square_logo_url} alt={selectedCasino.display_name} />
                      <span className={styles.logoPreviewText}>{selectedCasino.display_name}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Logo URL Input */}
          {logoType === "url" && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Logo URL</label>
              <input
                type="url"
                className={styles.input}
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
              {logoUrl && (
                <div className={styles.logoPreview}>
                  <img src={logoUrl} alt="Logo preview" />
                </div>
              )}
              {errors.logo && <span className={styles.error}>{errors.logo}</span>}
            </div>
          )}

          {/* Logo File Upload */}
          {logoType === "upload" && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Upload Logo</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
              {logoBase64 && (
                <div className={styles.logoPreview}>
                  <img src={logoBase64} alt="Logo preview" />
                </div>
              )}
              {errors.logo && <span className={styles.error}>{errors.logo}</span>}
            </div>
          )}

          {/* Provider Name */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              {type === "casino" ? "Casino Provider" : "Sportsbook Provider"} *
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder={type === "casino" ? "e.g., BetMGM Casino" : "e.g., DraftKings"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
          </div>

          {/* Welcome Offer */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Welcome Offer *</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g., Bet $5, Get $200 in Bonus Bets"
              value={welcomeOffer}
              onChange={(e) => setWelcomeOffer(e.target.value)}
              rows={3}
            />
            {errors.welcomeOffer && <span className={styles.error}>{errors.welcomeOffer}</span>}
          </div>

          {/* Score */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Rating (0-10)</label>
            <input
              type="number"
              className={styles.input}
              min="0"
              max="10"
              step="0.1"
              value={score}
              onChange={(e) => setScore(parseFloat(e.target.value))}
            />
            {errors.score && <span className={styles.error}>{errors.score}</span>}
          </div>

          {/* Locations - Country & Province Dropdowns */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Locations</label>

            <div className={styles.locationInputs}>
              <select
                className={styles.input}
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value as "" | "United States" | "Canada");
                  setSelectedProvince("");
                }}
              >
                <option value="">Select Country</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
              </select>

              {selectedCountry && (
                <select
                  className={styles.input}
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                >
                  <option value="">Select Province/State</option>
                  {getProvinceOptions().map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                className={styles.addLocationBtn}
                onClick={handleAddLocation}
                disabled={!selectedCountry || !selectedProvince}
              >
                Add
              </button>
            </div>

            {/* Selected Locations Pills */}
            {selectedLocations.length > 0 && (
              <div className={styles.locationPills}>
                {selectedLocations.map((location) => (
                  <span key={location} className={styles.locationPill}>
                    {location}
                    <button
                      type="button"
                      onClick={() => handleRemoveLocation(location)}
                      className={styles.removePill}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
              />
              <span>Set as Visible</span>
            </label>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleSubmit} className={styles.submitBtn}>
            {isEditMode ? "Update Offer" : "Add Offer"}
          </button>
        </div>
      </div>
    </div>
  );
}
