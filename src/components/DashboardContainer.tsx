"use client";

import React, { useState, useEffect } from "react";
import { Brand, Sportsbook, Casino } from "../types";
import { adminBootstrapApi, sportsbooksAdminApi, casinosAdminApi, locationsAdminApi, locationCasinosAdminApi, Location, LocationCasino } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import StatsHeader from "./StatsHeader";
import BrandCard from "./BrandCard";
import AddBrandModal from "./AddBrandModal";
import AuthModal from "./AuthModal";
import LocationsPanel from "./LocationsPanel";
import styles from "./DashboardContainer.module.css";

type MainTab = "offers" | "locations";

export default function DashboardContainer() {
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>("offers");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [locationRows, setLocationRows] = useState<Location[]>([]);
  const [locationCasinoRows, setLocationCasinoRows] = useState<LocationCasino[]>([]);
  // sbId -> province names, casinoId -> province names
  const [sbProvinces, setSbProvinces] = useState<Record<string, string[]>>({});
  const [casinoProvinces, setCasinoProvinces] = useState<Record<string, string[]>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "casino" | "sportsbook">("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "order-asc" | "order-desc">("order-asc");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const res = await adminBootstrapApi.fetch();
      if (!res.success || !res.data) {
        console.error("Bootstrap failed:", res.error);
        return;
      }

      const { sportsbooks: sbData, casinos: casinoData, locations: locData, location_casinos: locCasData } = res.data;

      const sportsbooks: Brand[] = sbData.map((sb: Sportsbook) => ({
        id: `sportsbook-${sb.id}`,
        type: "sportsbook" as const,
        data: sb,
      }));

      const casinos: Brand[] = casinoData.map((c: Casino) => ({
        id: `casino-${c.id}`,
        type: "casino" as const,
        data: c,
      }));

      setBrands([...sportsbooks, ...casinos]);
      setLocationRows(locData);
      setLocationCasinoRows(locCasData);

      const sbMap: Record<string, string[]> = {};
      locData.forEach((loc: Location) => {
        (loc.sportsbook_ids || []).forEach((sbId) => {
          if (!sbMap[sbId]) sbMap[sbId] = [];
          sbMap[sbId].push(loc.name);
        });
      });
      setSbProvinces(sbMap);

      const casinoMap: Record<string, string[]> = {};
      locCasData.forEach((loc: LocationCasino) => {
        (loc.casino_ids || []).forEach((cId) => {
          if (!casinoMap[cId]) casinoMap[cId] = [];
          casinoMap[cId].push(loc.name);
        });
      });
      setCasinoProvinces(casinoMap);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setIsLoading(false);
      setIsMounted(true);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchBrands();
    }
  }, [user, token]);

  const getNumericId = (id: string) => Number(id.split("-").slice(1).join("-"));

  const handleAddBrand = async (
    type: "sportsbook" | "casino",
    data: Omit<Sportsbook, "id"> | Omit<Casino, "id">
  ) => {
    try {
      if (type === "sportsbook") {
        const result = await sportsbooksAdminApi.create(data as Omit<Sportsbook, "id">);
        if (result.success && result.data) {
          setBrands((prev) => [
            { id: `sportsbook-${result.data!.id}`, type: "sportsbook", data: result.data! },
            ...prev,
          ]);
        } else {
          alert(`Failed to add sportsbook: ${result.error || "Unknown error"}`);
        }
      } else {
        const result = await casinosAdminApi.create(data as Omit<Casino, "id">);
        if (result.success && result.data) {
          setBrands((prev) => [
            { id: `casino-${result.data!.id}`, type: "casino", data: result.data! },
            ...prev,
          ]);
        } else {
          alert(`Failed to add casino: ${result.error || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Error adding brand:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    const brand = brands.find((b) => b.id === id);
    if (!brand) return;
    const numericId = getNumericId(id);
    try {
      if (brand.type === "sportsbook") {
        await sportsbooksAdminApi.delete(numericId);
      } else {
        await casinosAdminApi.delete(numericId);
      }
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Error deleting brand:", error);
    }
  };

  const handleToggleVisibility = async (id: string) => {
    const brand = brands.find((b) => b.id === id);
    if (!brand) return;
    const numericId = getNumericId(id);
    const newHidden = !brand.data.hidden;
    try {
      if (brand.type === "sportsbook") {
        const result = await sportsbooksAdminApi.update(numericId, { hidden: newHidden });
        if (result.success && result.data) {
          setBrands((prev) =>
            prev.map((b) =>
              b.id === id ? { ...b, data: result.data! } : b
            )
          );
        }
      } else {
        const result = await casinosAdminApi.update(numericId, { hidden: newHidden });
        if (result.success && result.data) {
          setBrands((prev) =>
            prev.map((b) =>
              b.id === id ? { ...b, data: result.data! } : b
            )
          );
        }
      }
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const handleEditBrand = (id: string) => {
    const brand = brands.find((b) => b.id === id);
    if (brand) {
      setEditingBrand(brand);
      setIsModalOpen(true);
    }
  };

  const handleUpdateBrand = async (
    type: "sportsbook" | "casino",
    data: Partial<Sportsbook> | Partial<Casino>
  ) => {
    if (!editingBrand) return;
    const numericId = getNumericId(editingBrand.id);
    try {
      if (type === "sportsbook") {
        const result = await sportsbooksAdminApi.update(numericId, data as Partial<Sportsbook>);
        if (result.success && result.data) {
          setBrands((prev) =>
            prev.map((b) =>
              b.id === editingBrand.id ? { ...b, data: result.data! } : b
            )
          );
        }
      } else {
        const result = await casinosAdminApi.update(numericId, data as Partial<Casino>);
        if (result.success && result.data) {
          setBrands((prev) =>
            prev.map((b) =>
              b.id === editingBrand.id ? { ...b, data: result.data! } : b
            )
          );
        }
      }
      setEditingBrand(null);
    } catch (error) {
      console.error("Error updating brand:", error);
    }
  };

  const handleUpdateLocation = async (locId: number, sportsbook_ids: string[]) => {
    const res = await locationsAdminApi.update(locId, sportsbook_ids);
    if (res.success && res.data) {
      setLocationRows((prev) => {
        const updated = prev.map((l) => l.id === locId ? res.data! : l);
        const sbMap: Record<string, string[]> = {};
        updated.forEach((loc) => {
          (loc.sportsbook_ids || []).forEach((sbId) => {
            if (!sbMap[sbId]) sbMap[sbId] = [];
            sbMap[sbId].push(loc.name);
          });
        });
        setSbProvinces(sbMap);
        return updated;
      });
    }
  };

  const handleUpdateLocationCasino = async (locId: number, casino_ids: string[]) => {
    const res = await locationCasinosAdminApi.update(locId, casino_ids);
    if (res.success && res.data) {
      setLocationCasinoRows((prev) => {
        const updated = prev.map((l) => l.id === locId ? res.data! : l);
        const casinoMap: Record<string, string[]> = {};
        updated.forEach((loc) => {
          (loc.casino_ids || []).forEach((cId) => {
            if (!casinoMap[cId]) casinoMap[cId] = [];
            casinoMap[cId].push(loc.name);
          });
        });
        setCasinoProvinces(casinoMap);
        return updated;
      });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setLocationFilter("all");
    setVisibilityFilter("all");
    setSortBy("order-asc");
  };

  const allLocations = React.useMemo(() => {
    const locales = new Set<string>();
    brands.forEach((brand) => {
      (brand.data.list_of_locations || []).forEach((loc) => locales.add(loc));
    });
    return Array.from(locales).sort();
  }, [brands]);

  const getName = (brand: Brand) =>
    brand.type === "sportsbook"
      ? (brand.data as Sportsbook).sportsbook_name
      : (brand.data as Casino).display_name;

  const filteredBrands = React.useMemo(() => {
    let result = [...brands];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((b) => getName(b).toLowerCase().includes(q));
    }

    if (typeFilter !== "all") {
      result = result.filter((b) => b.type === typeFilter);
    }

    if (locationFilter !== "all") {
      result = result.filter((b) =>
        (b.data.list_of_locations || []).includes(locationFilter)
      );
    }

    if (visibilityFilter === "visible") {
      result = result.filter((b) => b.data.hidden === false);
    } else if (visibilityFilter === "hidden") {
      result = result.filter((b) => b.data.hidden === true);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return getName(a).localeCompare(getName(b));
        case "name-desc":
          return getName(b).localeCompare(getName(a));
        case "order-desc":
          return b.data.display_order - a.data.display_order;
        case "order-asc":
        default:
          return a.data.display_order - b.data.display_order;
      }
    });

    return result;
  }, [brands, searchQuery, typeFilter, locationFilter, visibilityFilter, sortBy]);

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>PropsLogic Admin</h1>
            <span className={styles.subtitle}>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return <AuthModal />;
  }

  if (!isMounted || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>PropsLogic Admin</h1>
            <span className={styles.subtitle}>Loading from database...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>PropsLogic Admin</h1>
          <span className={styles.subtitle}>
            Welcome, {user.name} | Manage sportsbooks and casinos
          </span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New
          </button>
          <button className={styles.logoutBtn} onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Main tab switcher */}
      <div className={styles.mainTabs}>
        <button
          className={`${styles.mainTab} ${mainTab === "offers" ? styles.mainTabActive : ""}`}
          onClick={() => setMainTab("offers")}
        >
          Sportsbooks & Casinos
        </button>
        <button
          className={`${styles.mainTab} ${mainTab === "locations" ? styles.mainTabActive : ""}`}
          onClick={() => setMainTab("locations")}
        >
          Location Filtering
        </button>
      </div>

      {mainTab === "locations" && <LocationsPanel />}

      {mainTab === "offers" && <>
      <StatsHeader brands={brands} />

      <div className={styles.controlsPanel}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className={styles.filterSelect}>
            <option value="all">All Locations</option>
            {allLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value as "all" | "visible" | "hidden")} className={styles.filterSelect}>
            <option value="all">All Statuses</option>
            <option value="visible">Visible Only</option>
            <option value="hidden">Hidden Only</option>
          </select>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.tabs}>
            <button onClick={() => { setTypeFilter("all"); setVisibilityFilter("all"); }} className={`${styles.tab} ${typeFilter === "all" && visibilityFilter !== "hidden" ? styles.tabActive : ""}`}>
              All Types
            </button>
            <button onClick={() => { setTypeFilter("casino"); setVisibilityFilter("all"); }} className={`${styles.tab} ${typeFilter === "casino" && visibilityFilter !== "hidden" ? styles.tabCasinoActive : ""}`}>
              Casinos
            </button>
            <button onClick={() => { setTypeFilter("sportsbook"); setVisibilityFilter("all"); }} className={`${styles.tab} ${typeFilter === "sportsbook" && visibilityFilter !== "hidden" ? styles.tabSportsbookActive : ""}`}>
              Sportsbooks
            </button>
            <button onClick={() => { setTypeFilter("all"); setVisibilityFilter("hidden"); }} className={`${styles.tab} ${visibilityFilter === "hidden" ? styles.tabActive : ""}`}>
              Hidden
            </button>
          </div>

          <div className={styles.sortWrapper}>
            <span className={styles.sortLabel}>Sort By:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={styles.filterSelect} style={{ padding: "8px 12px", minWidth: "160px" }}>
              <option value="order-asc">Display Order: Low→High</option>
              <option value="order-desc">Display Order: High→Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>
      </div>

      {filteredBrands.length > 0 ? (
        <div className={styles.grid}>
          {filteredBrands.map((brand) => {
            const rawId = brand.type === "sportsbook"
              ? (brand.data as Sportsbook).sportsbook_id
              : (brand.data as Casino).casino_id;
            const provinces = rawId
              ? (brand.type === "sportsbook" ? sbProvinces[rawId] : casinoProvinces[rawId]) ?? []
              : [];
            return (
              <BrandCard
                key={brand.id}
                brand={brand}
                provinces={provinces}
                onDelete={handleDeleteBrand}
                onToggleVisibility={handleToggleVisibility}
                onEdit={handleEditBrand}
              />
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <h3 className={styles.emptyTitle}>No Results Found</h3>
          <p className={styles.emptyDesc}>
            No sportsbooks or casinos match your current filters.
          </p>
          <button className={styles.resetBtn} onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      )}

      {isModalOpen && (
        <AddBrandModal
          key={editingBrand?.id ?? "new"}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBrand(null);
          }}
          onAdd={handleAddBrand}
          onUpdate={handleUpdateBrand}
          editBrand={editingBrand}
          locations={locationRows}
          locationCasinos={locationCasinoRows}
          onUpdateLocation={handleUpdateLocation}
          onUpdateLocationCasino={handleUpdateLocationCasino}
        />
      )}
      </>}
    </div>
  );
}
