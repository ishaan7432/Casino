"use client";

import { useState } from "react";
import { Brand, Sportsbook, Casino } from "../types";
import { Location, LocationCasino } from "../lib/api";
import styles from "./AddBrandModal.module.css";

interface AddBrandModalProps {
  onClose: () => void;
  onAdd: (type: "sportsbook" | "casino", data: Omit<Sportsbook, "id"> | Omit<Casino, "id">) => Promise<void>;
  onUpdate: (type: "sportsbook" | "casino", data: Partial<Sportsbook> | Partial<Casino>) => Promise<void>;
  editBrand?: Brand | null;
  locations?: Location[];
  locationCasinos?: LocationCasino[];
  onUpdateLocation?: (locId: number, sportsbook_ids: string[]) => Promise<void>;
  onUpdateLocationCasino?: (locId: number, casino_ids: string[]) => Promise<void>;
}


function getSportsbookDefaults(sb?: Sportsbook): Omit<Sportsbook, "id"> {
  return {
    sportsbook_id: sb?.sportsbook_id ?? null,
    sportsbook_name: sb?.sportsbook_name ?? "",
    display_name: sb?.display_name ?? null,
    player_trend_display: sb?.player_trend_display ?? null,
    api_response: sb?.api_response ?? null,
    link: sb?.link ?? "",
    logo_url: sb?.logo_url ?? null,
    square_logo_url: sb?.square_logo_url ?? null,
    promo_code: sb?.promo_code ?? null,
    min_deposit: sb?.min_deposit ?? null,
    bg_color: sb?.bg_color ?? null,
    list_of_locations: sb?.list_of_locations ?? [],
    hidden: sb?.hidden ?? false,
    display_order: sb?.display_order ?? 0,
  };
}

function getCasinoDefaults(c?: Casino): Omit<Casino, "id"> {
  return {
    casino_id: c?.casino_id ?? null,
    display_name: c?.display_name ?? "",
    link: c?.link ?? null,
    logo_url: c?.logo_url ?? null,
    square_logo_url: c?.square_logo_url ?? null,
    promo_code: c?.promo_code ?? null,
    bg_color: c?.bg_color ?? null,
    list_of_locations: c?.list_of_locations ?? [],
    social_casino: c?.social_casino ?? false,
    hidden: c?.hidden ?? false,
    display_order: c?.display_order ?? 0,
    add_parameter: c?.add_parameter ?? null,
    ca_parameter: c?.ca_parameter ?? null,
    us_parameter: c?.us_parameter ?? null,
    parent_casino_id: c?.parent_casino_id ?? null,
    signup_tutorial_link: c?.signup_tutorial_link ?? null,
    superbowl_flag: c?.superbowl_flag ?? false,
  };
}

export default function AddBrandModal({
  onClose, onAdd, onUpdate, editBrand,
  locations = [], locationCasinos = [],
  onUpdateLocation, onUpdateLocationCasino,
}: AddBrandModalProps) {
  const isEditMode = !!editBrand;

  const [type, setType] = useState<"sportsbook" | "casino">(editBrand?.type ?? "sportsbook");

  // Sportsbook fields
  const [sb, setSb] = useState<Omit<Sportsbook, "id">>(() =>
    getSportsbookDefaults(editBrand?.type === "sportsbook" ? (editBrand.data as Sportsbook) : undefined)
  );

  // Casino fields
  const [casino, setCasino] = useState<Omit<Casino, "id">>(() =>
    getCasinoDefaults(editBrand?.type === "casino" ? (editBrand.data as Casino) : undefined)
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location editing state (edit mode only)
  const [locSaving, setLocSaving] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedAddLocId, setSelectedAddLocId] = useState<string>("");


  const updateSb = (field: keyof Omit<Sportsbook, "id">, value: unknown) =>
    setSb((prev) => ({ ...prev, [field]: value }));

  const updateCasino = (field: keyof Omit<Casino, "id">, value: unknown) =>
    setCasino((prev) => ({ ...prev, [field]: value }));

  // Derive the brand's raw ID (sportsbook_id or casino_id) used in location tables
  const brandRawId = isEditMode
    ? type === "sportsbook"
      ? (editBrand!.data as Sportsbook).sportsbook_id
      : (editBrand!.data as Casino).casino_id
    : null;

  // Which location rows currently include this brand
  const activeLocRows = type === "sportsbook"
    ? locations.filter((l) => brandRawId && (l.sportsbook_ids || []).includes(brandRawId))
    : locationCasinos.filter((l) => brandRawId && (l.casino_ids || []).includes(brandRawId));

  // Which location rows do NOT include this brand (available to add)
  const availableLocRows = type === "sportsbook"
    ? locations.filter((l) => !brandRawId || !(l.sportsbook_ids || []).includes(brandRawId))
    : locationCasinos.filter((l) => !brandRawId || !(l.casino_ids || []).includes(brandRawId));

  const handleRemoveFromLocation = async (locId: number) => {
    if (locSaving || !brandRawId) return;
    setLocSaving(true);
    if (type === "sportsbook") {
      const loc = locations.find((l) => l.id === locId);
      if (loc && onUpdateLocation) {
        await onUpdateLocation(locId, (loc.sportsbook_ids || []).filter((id) => id !== brandRawId));
      }
    } else {
      const loc = locationCasinos.find((l) => l.id === locId);
      if (loc && onUpdateLocationCasino) {
        await onUpdateLocationCasino(locId, (loc.casino_ids || []).filter((id) => id !== brandRawId));
      }
    }
    setLocSaving(false);
  };

  const handleAddToLocation = async () => {
    if (locSaving || !brandRawId || !selectedAddLocId) return;
    const locId = Number(selectedAddLocId);
    setLocSaving(true);
    if (type === "sportsbook") {
      const loc = locations.find((l) => l.id === locId);
      if (loc && onUpdateLocation) {
        await onUpdateLocation(locId, [...(loc.sportsbook_ids || []), brandRawId]);
      }
    } else {
      const loc = locationCasinos.find((l) => l.id === locId);
      if (loc && onUpdateLocationCasino) {
        await onUpdateLocationCasino(locId, [...(loc.casino_ids || []), brandRawId]);
      }
    }
    setSelectedCountry("");
    setSelectedAddLocId("");
    setLocSaving(false);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (type === "sportsbook") {
      if (!sb.sportsbook_name.trim()) errs.name = "Name is required";
      if (!sb.link.trim()) errs.link = "Link is required";
    } else {
      if (!casino.display_name.trim()) errs.name = "Name is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await (type === "sportsbook" ? onUpdate("sportsbook", sb) : onUpdate("casino", casino));
      } else {
        await (type === "sportsbook" ? onAdd("sportsbook", sb) : onAdd("casino", casino));
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${type === "casino" ? styles.casinoTheme : styles.sportsbookTheme}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditMode ? "Edit Entry" : "Add New Entry"}</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        <div className={styles.body}>
          {/* Type selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Type</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input type="radio" name="type" checked={type === "sportsbook"} onChange={() => setType("sportsbook")} disabled={isEditMode} />
                <span>Sportsbook</span>
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" name="type" checked={type === "casino"} onChange={() => setType("casino")} disabled={isEditMode} />
                <span>Casino</span>
              </label>
            </div>
          </div>

          {/* ===== SPORTSBOOK FIELDS ===== */}
          {type === "sportsbook" && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Sportsbook Name *</label>
                <input className={styles.input} value={sb.sportsbook_name} onChange={(e) => updateSb("sportsbook_name", e.target.value)} placeholder="e.g. DraftKings" />
                {errors.name && <span className={styles.error}>{errors.name}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Display Name</label>
                <input className={styles.input} value={sb.display_name ?? ""} onChange={(e) => updateSb("display_name", e.target.value || null)} placeholder="e.g. DraftKings Sportsbook" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Link *</label>
                <input className={styles.input} type="url" value={sb.link} onChange={(e) => updateSb("link", e.target.value)} placeholder="https://..." />
                {errors.link && <span className={styles.error}>{errors.link}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Logo URL</label>
                <input className={styles.input} type="url" value={sb.logo_url ?? ""} onChange={(e) => updateSb("logo_url", e.target.value || null)} placeholder="https://..." />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Square Logo URL</label>
                <input className={styles.input} type="url" value={sb.square_logo_url ?? ""} onChange={(e) => updateSb("square_logo_url", e.target.value || null)} placeholder="https://..." />
                {sb.square_logo_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={sb.square_logo_url} alt="logo preview" style={{ height: 40, marginTop: 6, borderRadius: 4 }} />
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Promo Code</label>
                <input className={styles.input} value={sb.promo_code ?? ""} onChange={(e) => updateSb("promo_code", e.target.value || null)} placeholder="e.g. SHARP50" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Min Deposit</label>
                <input className={styles.input} type="number" value={sb.min_deposit ?? ""} onChange={(e) => updateSb("min_deposit", e.target.value || null)} placeholder="e.g. 10" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Background Color</label>
                <input className={styles.input} value={sb.bg_color ?? ""} onChange={(e) => updateSb("bg_color", e.target.value || null)} placeholder="e.g. #1a1a2e" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Player Trend Display</label>
                <input className={styles.input} value={sb.player_trend_display ?? ""} onChange={(e) => updateSb("player_trend_display", e.target.value || null)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>API Response Key</label>
                <input className={styles.input} value={sb.api_response ?? ""} onChange={(e) => updateSb("api_response", e.target.value || null)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Sportsbook ID</label>
                <input className={styles.input} value={sb.sportsbook_id ?? ""} onChange={(e) => updateSb("sportsbook_id", e.target.value || null)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Display Order</label>
                <input className={styles.input} type="number" value={sb.display_order} onChange={(e) => updateSb("display_order", Number(e.target.value))} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={sb.hidden} onChange={(e) => updateSb("hidden", e.target.checked)} />
                  <span>Hidden (not shown in ambassador APIs)</span>
                </label>
              </div>
            </>
          )}

          {/* ===== CASINO FIELDS ===== */}
          {type === "casino" && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>Display Name *</label>
                <input className={styles.input} value={casino.display_name} onChange={(e) => updateCasino("display_name", e.target.value)} placeholder="e.g. BetMGM Casino" />
                {errors.name && <span className={styles.error}>{errors.name}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Link</label>
                <input className={styles.input} type="url" value={casino.link ?? ""} onChange={(e) => updateCasino("link", e.target.value || null)} placeholder="https://..." />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Logo URL</label>
                <input className={styles.input} type="url" value={casino.logo_url ?? ""} onChange={(e) => updateCasino("logo_url", e.target.value || null)} placeholder="https://..." />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Square Logo URL</label>
                <input className={styles.input} type="url" value={casino.square_logo_url ?? ""} onChange={(e) => updateCasino("square_logo_url", e.target.value || null)} placeholder="https://..." />
                {casino.square_logo_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={casino.square_logo_url} alt="logo preview" style={{ height: 40, marginTop: 6, borderRadius: 4 }} />
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Promo Code</label>
                <input className={styles.input} value={casino.promo_code ?? ""} onChange={(e) => updateCasino("promo_code", e.target.value || null)} placeholder="e.g. SHARP50" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Background Color</label>
                <input className={styles.input} value={casino.bg_color ?? ""} onChange={(e) => updateCasino("bg_color", e.target.value || null)} placeholder="e.g. #1a1a2e" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Casino ID</label>
                <input className={styles.input} value={casino.casino_id ?? ""} onChange={(e) => updateCasino("casino_id", e.target.value || null)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Parent Casino ID</label>
                <input className={styles.input} value={casino.parent_casino_id ?? ""} onChange={(e) => updateCasino("parent_casino_id", e.target.value || null)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Add Parameter</label>
                <input className={styles.input} value={casino.add_parameter ?? ""} onChange={(e) => updateCasino("add_parameter", e.target.value || null)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>CA Parameter</label>
                <input className={styles.input} value={casino.ca_parameter ?? ""} onChange={(e) => updateCasino("ca_parameter", e.target.value || null)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>US Parameter</label>
                <input className={styles.input} value={casino.us_parameter ?? ""} onChange={(e) => updateCasino("us_parameter", e.target.value || null)} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Signup Tutorial Link</label>
                <input className={styles.input} type="url" value={casino.signup_tutorial_link ?? ""} onChange={(e) => updateCasino("signup_tutorial_link", e.target.value || null)} placeholder="https://..." />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Display Order</label>
                <input className={styles.input} type="number" value={casino.display_order} onChange={(e) => updateCasino("display_order", Number(e.target.value))} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={casino.hidden} onChange={(e) => updateCasino("hidden", e.target.checked)} />
                  <span>Hidden (not shown in ambassador APIs)</span>
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={casino.social_casino} onChange={(e) => updateCasino("social_casino", e.target.checked)} />
                  <span>Social Casino</span>
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={casino.superbowl_flag} onChange={(e) => updateCasino("superbowl_flag", e.target.checked)} />
                  <span>Super Bowl Flag</span>
                </label>
              </div>
            </>
          )}

          {/* ===== LOCATIONS (edit mode only) ===== */}
          {isEditMode && brandRawId && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Active Provinces</label>

              {activeLocRows.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  Not active in any province.
                </p>
              ) : (
                <div className={styles.locationPills}>
                  {activeLocRows.map((loc) => (
                    <span key={loc.id} className={styles.locationPill}>
                      {loc.name}
                      <button
                        type="button"
                        className={styles.removePill}
                        onClick={() => handleRemoveFromLocation(loc.id)}
                        disabled={locSaving}
                        title="Remove from this province"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {availableLocRows.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  <select
                    className={styles.input}
                    value={selectedCountry}
                    onChange={(e) => { setSelectedCountry(e.target.value); setSelectedAddLocId(""); }}
                    disabled={locSaving}
                  >
                    <option value="">Select country...</option>
                    {Array.from(new Set(availableLocRows.map((l) => l.country || "Other"))).sort().map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {selectedCountry && (
                    <div className={styles.locationInputs}>
                      <select
                        className={styles.input}
                        value={selectedAddLocId}
                        onChange={(e) => setSelectedAddLocId(e.target.value)}
                        disabled={locSaving}
                      >
                        <option value="">Select province/state...</option>
                        {availableLocRows
                          .filter((l) => (l.country || "Other") === selectedCountry)
                          .map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                          ))}
                      </select>
                      <button
                        type="button"
                        className={styles.addLocationBtn}
                        onClick={handleAddToLocation}
                        disabled={locSaving || !selectedAddLocId}
                      >
                        {locSaving ? "..." : "Add"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelBtn} disabled={isSubmitting}>Cancel</button>
          <button onClick={handleSubmit} className={styles.submitBtn} disabled={isSubmitting}>
            <span className={styles.submitBtnInner}>
              {isSubmitting && <span className={styles.btnSpinner} />}
              {isSubmitting ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save Changes" : "Add Entry")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
