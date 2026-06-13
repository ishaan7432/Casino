"use client";

import React, { useState, useEffect } from "react";
import { Brand } from "../types";
import { sportsbookOffersApi, casinoOffersApi, SportsbookOffer, CasinoOffer } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import StatsHeader from "./StatsHeader";
import BrandCard from "./BrandCard";
import AddBrandModal from "./AddBrandModal";
import AuthModal from "./AuthModal";
import styles from "./DashboardContainer.module.css";

export default function DashboardContainer() {
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "casino" | "sportsbook">("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [sortBy, setSortBy] = useState<"rating-desc" | "rating-asc" | "name-asc" | "name-desc" | "date-desc">("rating-desc");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Fetch brands from backend API on mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoading(true);

        // Fetch both sportsbooks and casinos in parallel
        const [sportsbooksRes, casinosRes] = await Promise.all([
          sportsbookOffersApi.list(),
          casinoOffersApi.list()
        ]);

        // Convert to Brand format with prefixed IDs to avoid duplicates
        const sportsbooks: Brand[] = (sportsbooksRes.data || []).map((sb: SportsbookOffer) => ({
          id: `sportsbook-${sb.id}`,
          name: sb.name,
          type: "sportsbook" as const,
          logo: sb.logo || "",
          welcomeOffer: sb.welcome_offer || "",
          score: Number(sb.score),
          locations: sb.locations || [],
          visibility: Boolean(sb.visibility),
          createdAt: sb.created_at || new Date().toISOString(),
        }));

        const casinos: Brand[] = (casinosRes.data || []).map((c: CasinoOffer) => ({
          id: `casino-${c.id}`,
          name: c.name,
          type: "casino" as const,
          logo: c.logo || "",
          welcomeOffer: c.welcome_offer || "",
          score: Number(c.score),
          locations: c.locations || [],
          visibility: Boolean(c.visibility),
          createdAt: c.created_at || new Date().toISOString(),
        }));

        setBrands([...sportsbooks, ...casinos]);
      } catch (error) {
        console.error("Error fetching brands:", error);
      } finally {
        setIsLoading(false);
        setIsMounted(true);
      }
    };

    fetchBrands();
  }, []);

  // Add Brand
  const handleAddBrand = async (newBrandData: Omit<Brand, "id" | "createdAt">) => {
    try {
      const data = {
        name: newBrandData.name,
        logo: newBrandData.logo,
        welcome_offer: newBrandData.welcomeOffer,
        score: newBrandData.score,
        locations: newBrandData.locations,
        visibility: newBrandData.visibility,
      };

      console.log("Attempting to add brand:", data);

      if (newBrandData.type === "sportsbook") {
        const result = await sportsbookOffersApi.create(data);
        console.log("Sportsbook create result:", result);

        if (result.success && result.data) {
          const newBrand: Brand = {
            id: `sportsbook-${result.data.id}`,
            name: result.data.name,
            type: "sportsbook",
            logo: result.data.logo || "",
            welcomeOffer: result.data.welcome_offer || "",
            score: Number(result.data.score),
            locations: result.data.locations || [],
            visibility: Boolean(result.data.visibility),
            createdAt: result.data.created_at || new Date().toISOString(),
          };
          setBrands([newBrand, ...brands]);
        } else {
          alert(`Failed to add sportsbook: ${result.error || "Unknown error"}`);
        }
      } else {
        const result = await casinoOffersApi.create(data);
        console.log("Casino create result:", result);

        if (result.success && result.data) {
          const newBrand: Brand = {
            id: `casino-${result.data.id}`,
            name: result.data.name,
            type: "casino",
            logo: result.data.logo || "",
            welcomeOffer: result.data.welcome_offer || "",
            score: Number(result.data.score),
            locations: result.data.locations || [],
            visibility: Boolean(result.data.visibility),
            createdAt: result.data.created_at || new Date().toISOString(),
          };
          setBrands([newBrand, ...brands]);
        } else {
          alert(`Failed to add casino: ${result.error || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Error adding brand:", error);
      alert(`Error adding brand: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Delete Brand
  const handleDeleteBrand = async (id: string) => {
    try {
      const brand = brands.find(b => b.id === id);
      if (!brand) return;

      // Extract numeric ID from prefixed ID (e.g., "sportsbook-2" -> 2)
      const numericId = Number(id.split('-')[1]);

      if (brand.type === "sportsbook") {
        await sportsbookOffersApi.delete(numericId);
      } else {
        await casinoOffersApi.delete(numericId);
      }

      setBrands(brands.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Error deleting brand:", error);
    }
  };

  // Toggle Visibility
  const handleToggleVisibility = async (id: string) => {
    try {
      const brand = brands.find(b => b.id === id);
      if (!brand) return;

      // Extract numeric ID from prefixed ID (e.g., "sportsbook-2" -> 2)
      const numericId = Number(id.split('-')[1]);
      const newVisibility = !brand.visibility;

      if (brand.type === "sportsbook") {
        await sportsbookOffersApi.update(numericId, { visibility: newVisibility });
      } else {
        await casinoOffersApi.update(numericId, { visibility: newVisibility });
      }

      setBrands(brands.map((b) =>
        b.id === id ? { ...b, visibility: newVisibility } : b
      ));
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  // Edit Brand
  const handleEditBrand = (id: string) => {
    const brand = brands.find(b => b.id === id);
    if (brand) {
      setEditingBrand(brand);
      setIsModalOpen(true);
    }
  };

  // Update Brand
  const handleUpdateBrand = async (updatedBrandData: Omit<Brand, "id" | "createdAt">) => {
    if (!editingBrand) return;

    try {
      const numericId = Number(editingBrand.id.split('-')[1]);
      const data = {
        name: updatedBrandData.name,
        logo: updatedBrandData.logo,
        welcome_offer: updatedBrandData.welcomeOffer,
        score: updatedBrandData.score,
        locations: updatedBrandData.locations,
        visibility: updatedBrandData.visibility,
      };

      if (editingBrand.type === "sportsbook") {
        const result = await sportsbookOffersApi.update(numericId, data);
        if (result.success && result.data) {
          const updatedData = result.data;
          setBrands(brands.map(b =>
            b.id === editingBrand.id
              ? {
                  ...b,
                  name: updatedData.name,
                  logo: updatedData.logo || "",
                  welcomeOffer: updatedData.welcome_offer || "",
                  score: Number(updatedData.score),
                  locations: updatedData.locations || [],
                  visibility: Boolean(updatedData.visibility),
                }
              : b
          ));
        }
      } else {
        const result = await casinoOffersApi.update(numericId, data);
        if (result.success && result.data) {
          const updatedData = result.data;
          setBrands(brands.map(b =>
            b.id === editingBrand.id
              ? {
                  ...b,
                  name: updatedData.name,
                  logo: updatedData.logo || "",
                  welcomeOffer: updatedData.welcome_offer || "",
                  score: Number(updatedData.score),
                  locations: updatedData.locations || [],
                  visibility: Boolean(updatedData.visibility),
                }
              : b
          ));
        }
      }

      setEditingBrand(null);
    } catch (error) {
      console.error("Error updating brand:", error);
    }
  };

  // Reset all search and filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setLocationFilter("all");
    setVisibilityFilter("all");
    setSortBy("rating-desc");
  };

  // Compute unique locations dynamically from current brands list
  const allLocations = React.useMemo(() => {
    const locales = new Set<string>();
    brands.forEach((brand) => {
      brand.locations.forEach((loc) => locales.add(loc));
    });
    return Array.from(locales).sort();
  }, [brands]);

  // Filter and Sort Logic
  const filteredBrands = React.useMemo(() => {
    let result = [...brands];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.welcomeOffer.toLowerCase().includes(query) ||
          b.locations.some((loc) => loc.toLowerCase().includes(query))
      );
    }

    // 2. Operator Type Filter
    if (typeFilter !== "all") {
      result = result.filter((b) => b.type === typeFilter);
    }

    // 3. Location Filter
    if (locationFilter !== "all") {
      result = result.filter((b) => b.locations.includes(locationFilter));
    }

    // 4. Visibility Filter
    if (visibilityFilter === "visible") {
      result = result.filter((b) => b.visibility === true);
    } else if (visibilityFilter === "hidden") {
      result = result.filter((b) => b.visibility === false);
    }

    // 5. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "rating-asc":
          return a.score - b.score;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "rating-desc":
        default:
          return b.score - a.score;
      }
    });

    return result;
  }, [brands, searchQuery, typeFilter, locationFilter, visibilityFilter, sortBy]);

  // Show auth modal if not logged in
  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>OfferStakes Admin</h1>
            <span className={styles.subtitle}>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return <AuthModal />;
  }

  // Hydration safeguard: Render layout skeleton during server build/initial hydration
  if (!isMounted || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>OfferStakes Admin</h1>
            <span className={styles.subtitle}>Loading operators from database...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Area */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>OfferStakes Admin</h1>
          <span className={styles.subtitle}>
            Welcome, {user.name} | Manage casino and sportsbook operators
          </span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={() => setIsModalOpen(true)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Offer
          </button>
          <button className={styles.logoutBtn} onClick={logout}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Statistics Header Widgets */}
      <StatsHeader brands={brands} />

      {/* Filters & Controls Panel */}
      <div className={styles.controlsPanel}>
        {/* Search Row */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, offers, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Location Dropdown */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Provinces</option>
            {allLocations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Visibility Status Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as "all" | "visible" | "hidden")}
            className={styles.filterSelect}
          >
            <option value="all">All Statuses</option>
            <option value="visible">Visible Only</option>
            <option value="hidden">Hidden Only</option>
          </select>
        </div>

        {/* Tab Row & Sorting */}
        <div className={styles.filterRow}>
          {/* Operator Category Tabs */}
          <div className={styles.tabs}>
            <button
              onClick={() => {
                setTypeFilter("all");
                setVisibilityFilter("all");
              }}
              className={`${styles.tab} ${typeFilter === "all" && visibilityFilter !== "hidden" ? styles.tabActive : ""}`}
            >
              All Types
            </button>
            <button
              onClick={() => {
                setTypeFilter("casino");
                setVisibilityFilter("all");
              }}
              className={`${styles.tab} ${
                typeFilter === "casino" && visibilityFilter !== "hidden" ? styles.tabCasinoActive : ""
              }`}
            >
              Casinos
            </button>
            <button
              onClick={() => {
                setTypeFilter("sportsbook");
                setVisibilityFilter("all");
              }}
              className={`${styles.tab} ${
                typeFilter === "sportsbook" && visibilityFilter !== "hidden" ? styles.tabSportsbookActive : ""
              }`}
            >
              Sportsbooks
            </button>
            <button
              onClick={() => {
                setTypeFilter("all");
                setVisibilityFilter("hidden");
              }}
              className={`${styles.tab} ${
                visibilityFilter === "hidden" ? styles.tabActive : ""
              }`}
            >
              Hidden
            </button>
          </div>

          {/* Sort Controller */}
          <div className={styles.sortWrapper}>
            <span className={styles.sortLabel}>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "rating-desc" | "rating-asc" | "name-asc" | "name-desc" | "date-desc")}
              className={styles.filterSelect}
              style={{ padding: "8px 12px", minWidth: "160px" }}
            >
              <option value="rating-desc">Rating: High to Low</option>
              <option value="rating-asc">Rating: Low to High</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="date-desc">Date Added: Newest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operator Grid List */}
      {filteredBrands.length > 0 ? (
        <div className={styles.grid}>
          {filteredBrands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onDelete={handleDeleteBrand}
              onToggleVisibility={handleToggleVisibility}
              onEdit={handleEditBrand}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className={styles.emptyState}>
          <svg
            className={styles.emptyIcon}
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <h3 className={styles.emptyTitle}>No Offers Found</h3>
          <p className={styles.emptyDesc}>
            We couldn&apos;t find any casinos or sportsbooks matching your active search filters or
            selected location. Try widening your criteria.
          </p>
          <button className={styles.resetBtn} onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      )}

      {/* Add/Edit Operator Modal */}
      {isModalOpen && (
        <AddBrandModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingBrand(null);
          }}
          onAdd={editingBrand ? handleUpdateBrand : handleAddBrand}
          editBrand={editingBrand}
        />
      )}
    </div>
  );
}
