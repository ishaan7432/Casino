"use client";

import { useState, useEffect, useMemo } from "react";
import {
  locationsAdminApi,
  locationCasinosAdminApi,
  sportsbooksAdminApi,
  casinosAdminApi,
  Location,
  LocationCasino,
  Sportsbook,
  Casino,
} from "../lib/api";
import styles from "./LocationsPanel.module.css";

type Tab = "sportsbooks" | "casinos" | "social-casinos";

export default function LocationsPanel() {
  const [tab, setTab] = useState<Tab>("sportsbooks");

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationCasinos, setLocationCasinos] = useState<LocationCasino[]>([]);
  const [sportsbooks, setSportsbooks] = useState<Sportsbook[]>([]);
  const [casinos, setCasinos] = useState<Casino[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Per-row expanded state and search
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerSearch, setPickerSearch] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [locRes, locCasRes, sbRes, casinoRes] = await Promise.all([
        locationsAdminApi.list(),
        locationCasinosAdminApi.list(),
        sportsbooksAdminApi.list(),
        casinosAdminApi.list(),
      ]);
      setLocations(locRes.data || []);
      setLocationCasinos(locCasRes.data || []);
      setSportsbooks(sbRes.data || []);
      setCasinos(casinoRes.data || []);
      setIsLoading(false);
    };
    load();
  }, []);

  // Build lookup maps: sportsbook_id -> name, casino_id -> name
  const sbById = useMemo(() => {
    const m: Record<string, Sportsbook> = {};
    sportsbooks.forEach((sb) => { if (sb.sportsbook_id) m[sb.sportsbook_id] = sb; });
    return m;
  }, [sportsbooks]);

  const casinoById = useMemo(() => {
    const m: Record<string, Casino> = {};
    casinos.forEach((c) => { if (c.casino_id) m[c.casino_id] = c; });
    return m;
  }, [casinos]);

  // ---- Sportsbook location handlers ----

  const handleRemoveSportsbook = async (locId: number, sbId: string) => {
    const loc = locations.find((l) => l.id === locId);
    if (!loc) return;
    const updated = (loc.sportsbook_ids || []).filter((id) => id !== sbId);
    setSavingId(locId);
    const res = await locationsAdminApi.update(locId, updated);
    if (res.success && res.data) {
      setLocations((prev) => prev.map((l) => l.id === locId ? res.data! : l));
    }
    setSavingId(null);
  };

  const handleAddSportsbook = async (locId: number, sbId: string) => {
    const loc = locations.find((l) => l.id === locId);
    if (!loc || (loc.sportsbook_ids || []).includes(sbId)) return;
    const updated = [...(loc.sportsbook_ids || []), sbId];
    setSavingId(locId);
    const res = await locationsAdminApi.update(locId, updated);
    if (res.success && res.data) {
      setLocations((prev) => prev.map((l) => l.id === locId ? res.data! : l));
    }
    setSavingId(null);
    setPickerSearch((prev) => ({ ...prev, [locId]: "" }));
  };

  // ---- Casino location handlers ----

  const handleRemoveCasino = async (locId: number, casinoId: string) => {
    const loc = locationCasinos.find((l) => l.id === locId);
    if (!loc) return;
    const updated = (loc.casino_ids || []).filter((id) => id !== casinoId);
    setSavingId(locId);
    const res = await locationCasinosAdminApi.update(locId, updated);
    if (res.success && res.data) {
      setLocationCasinos((prev) => prev.map((l) => l.id === locId ? res.data! : l));
    }
    setSavingId(null);
  };

  const handleAddCasino = async (locId: number, casinoId: string) => {
    const loc = locationCasinos.find((l) => l.id === locId);
    if (!loc || (loc.casino_ids || []).includes(casinoId)) return;
    const updated = [...(loc.casino_ids || []), casinoId];
    setSavingId(locId);
    const res = await locationCasinosAdminApi.update(locId, updated);
    if (res.success && res.data) {
      setLocationCasinos((prev) => prev.map((l) => l.id === locId ? res.data! : l));
    }
    setSavingId(null);
    setPickerSearch((prev) => ({ ...prev, [locId]: "" }));
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.spinner} />
        <span>Loading location data...</span>
      </div>
    );
  }

  const filteredLocations = locations.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.country || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLocationCasinos = locationCasinos.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.country || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <div className={styles.titleIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h2 className={styles.title}>Location Filtering</h2>
          </div>
          <p className={styles.subtitle}>
            Controls which {tab === "sportsbooks" ? "sportsbooks" : tab === "casinos" ? "casinos" : "social casinos"} appear per province/state in the ambassador API.
          </p>
        </div>
        <div className={styles.tabGroup}>
          <button
            className={`${styles.tabBtn} ${tab === "sportsbooks" ? styles.tabBtnActive : ""}`}
            onClick={() => { setTab("sportsbooks"); setExpandedId(null); setSearchQuery(""); }}
          >
            <span className={styles.tabDot} />
            Sportsbooks
          </button>
          <button
            className={`${styles.tabBtn} ${styles.tabBtnCasino} ${tab === "casinos" ? styles.tabBtnActive : ""}`}
            onClick={() => { setTab("casinos"); setExpandedId(null); setSearchQuery(""); }}
          >
            <span className={styles.tabDot} />
            Casinos
          </button>
          <button
            className={`${styles.tabBtn} ${styles.tabBtnSocial} ${tab === "social-casinos" ? styles.tabBtnActive : ""}`}
            onClick={() => { setTab("social-casinos"); setExpandedId(null); setSearchQuery(""); }}
          >
            <span className={styles.tabDot} />
            Social Casinos
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search provinces / countries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className={styles.count}>
          {tab === "sportsbooks" ? filteredLocations.length : filteredLocationCasinos.length} provinces
        </span>
      </div>

      {/* Location rows */}
      <div className={styles.list}>
        {tab === "sportsbooks" && filteredLocations.map((loc) => {
          const ids = loc.sportsbook_ids || [];
          const isExpanded = expandedId === loc.id;
          const isSaving = savingId === loc.id;
          const pSearch = pickerSearch[loc.id] || "";
          const availableToAdd = sportsbooks.filter(
            (sb) => sb.sportsbook_id && !ids.includes(sb.sportsbook_id) &&
              (sb.sportsbook_name.toLowerCase().includes(pSearch.toLowerCase()) ||
               (sb.display_name || "").toLowerCase().includes(pSearch.toLowerCase()))
          );

          return (
            <div key={loc.id} className={`${styles.locRow} ${isExpanded ? styles.locRowExpanded : ""}`}>
              <div className={styles.locHeader} onClick={() => setExpandedId(isExpanded ? null : loc.id)}>
                <div className={styles.locMeta}>
                  <span className={styles.locName}>{loc.name}</span>
                  <span className={styles.locCountry}>{loc.country || "—"}</span>
                </div>
                <div className={styles.locStats}>
                  <span className={`${styles.idCount} ${ids.length === 0 ? styles.idCountEmpty : ""}`}>
                    {ids.length} sportsbook{ids.length !== 1 ? "s" : ""}
                  </span>
                  {isSaving && <span className={styles.savingSpinner} />}
                  <span className={styles.chevron}>{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.locBody}>
                  {/* Current sportsbooks */}
                  <div className={styles.section}>
                    <div className={styles.sectionLabel}>Currently allowed ({ids.length})</div>
                    {ids.length === 0 ? (
                      <p className={styles.emptyMsg}>No sportsbooks — users in this province see nothing.</p>
                    ) : (
                      <div className={styles.idList}>
                        {ids.map((sbId) => {
                          const sb = sbById[sbId];
                          return (
                            <div key={sbId} className={styles.idRow}>
                              {sb?.square_logo_url && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={sb.square_logo_url} alt="" className={styles.idLogo} />
                              )}
                              <div className={styles.idInfo}>
                                <span className={styles.idName}>{sb?.sportsbook_name ?? sbId}</span>
                                {sb?.hidden && <span className={styles.hiddenTag}>hidden</span>}
                                <span className={styles.idRaw}>{sbId}</span>
                              </div>
                              <button
                                className={styles.removeBtn}
                                onClick={() => handleRemoveSportsbook(loc.id, sbId)}
                                disabled={isSaving}
                                title="Remove from this province"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add sportsbook */}
                  <div className={styles.section}>
                    <div className={styles.sectionLabel}>Add sportsbook</div>
                    <input
                      type="text"
                      className={styles.pickerSearch}
                      placeholder="Search to add..."
                      value={pSearch}
                      onChange={(e) => setPickerSearch((prev) => ({ ...prev, [loc.id]: e.target.value }))}
                    />
                    {pSearch && (
                      <div className={styles.pickerList}>
                        {availableToAdd.slice(0, 8).map((sb) => (
                          <button
                            key={sb.id}
                            className={styles.pickerItem}
                            onClick={() => handleAddSportsbook(loc.id, sb.sportsbook_id!)}
                            disabled={isSaving}
                          >
                            {sb.square_logo_url && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={sb.square_logo_url} alt="" className={styles.idLogo} />
                            )}
                            <span>{sb.sportsbook_name}</span>
                            {sb.hidden && <span className={styles.hiddenTag}>hidden</span>}
                          </button>
                        ))}
                        {availableToAdd.length === 0 && (
                          <p className={styles.emptyMsg}>No matches</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {(tab === "casinos" || tab === "social-casinos") && filteredLocationCasinos.map((loc) => {
          const ids = loc.casino_ids || [];
          const isSocial = tab === "social-casinos";
          // In social tab only show social casino IDs; in casinos tab only show non-social
          const visibleIds = ids.filter((cId) => {
            const c = casinoById[cId];
            return isSocial ? c?.social_casino === true : c?.social_casino !== true;
          });
          const isExpanded = expandedId === loc.id;
          const isSaving = savingId === loc.id;
          const pSearch = pickerSearch[loc.id] || "";
          const availableToAdd = casinos.filter(
            (c) => c.casino_id && !ids.includes(c.casino_id) &&
              c.social_casino === isSocial &&
              (c.display_name.toLowerCase().includes(pSearch.toLowerCase()))
          );

          return (
            <div key={loc.id} className={`${styles.locRow} ${isExpanded ? styles.locRowExpanded : ""}`}>
              <div className={styles.locHeader} onClick={() => setExpandedId(isExpanded ? null : loc.id)}>
                <div className={styles.locMeta}>
                  <span className={styles.locName}>{loc.name}</span>
                  <span className={styles.locCountry}>{loc.country || "—"}</span>
                </div>
                <div className={styles.locStats}>
                  <span className={`${styles.idCount} ${visibleIds.length === 0 ? styles.idCountEmpty : ""}`}>
                    {visibleIds.length} {isSocial ? "social casino" : "casino"}{visibleIds.length !== 1 ? "s" : ""}
                  </span>
                  {isSaving && <span className={styles.savingSpinner} />}
                  <span className={styles.chevron}>{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.locBody}>
                  <div className={styles.section}>
                    <div className={styles.sectionLabel}>Currently allowed ({visibleIds.length})</div>
                    {visibleIds.length === 0 ? (
                      <p className={styles.emptyMsg}>No {isSocial ? "social casinos" : "casinos"} — users in this province see nothing.</p>
                    ) : (
                      <div className={styles.idList}>
                        {visibleIds.map((casinoId) => {
                          const c = casinoById[casinoId];
                          return (
                            <div key={casinoId} className={styles.idRow}>
                              {c?.square_logo_url && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={c.square_logo_url} alt="" className={styles.idLogo} />
                              )}
                              <div className={styles.idInfo}>
                                <span className={styles.idName}>{c?.display_name ?? casinoId}</span>
                                {c?.hidden && <span className={styles.hiddenTag}>hidden</span>}
                                <span className={styles.idRaw}>{casinoId}</span>
                              </div>
                              <button
                                className={styles.removeBtn}
                                onClick={() => handleRemoveCasino(loc.id, casinoId)}
                                disabled={isSaving}
                                title="Remove from this province"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className={styles.section}>
                    <div className={styles.sectionLabel}>Add {isSocial ? "social casino" : "casino"}</div>
                    <input
                      type="text"
                      className={styles.pickerSearch}
                      placeholder="Search to add..."
                      value={pSearch}
                      onChange={(e) => setPickerSearch((prev) => ({ ...prev, [loc.id]: e.target.value }))}
                    />
                    {pSearch && (
                      <div className={styles.pickerList}>
                        {availableToAdd.slice(0, 8).map((c) => (
                          <button
                            key={c.id}
                            className={styles.pickerItem}
                            onClick={() => handleAddCasino(loc.id, c.casino_id!)}
                            disabled={isSaving}
                          >
                            {c.square_logo_url && (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={c.square_logo_url} alt="" className={styles.idLogo} />
                            )}
                            <span>{c.display_name}</span>
                            {c.hidden && <span className={styles.hiddenTag}>hidden</span>}
                          </button>
                        ))}
                        {availableToAdd.length === 0 && <p className={styles.emptyMsg}>No matches</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
