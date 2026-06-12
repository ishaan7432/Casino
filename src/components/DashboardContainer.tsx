"use client";

import React, { useState, useEffect } from "react";
import { Brand } from "../types";
import { INITIAL_BRANDS } from "../mockData";
import StatsHeader from "./StatsHeader";
import BrandCard from "./BrandCard";
import AddBrandModal from "./AddBrandModal";
import styles from "./DashboardContainer.module.css";

export default function DashboardContainer() {
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [isMounted, setIsMounted] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "casino" | "sportsbook">("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [sortBy, setSortBy] = useState<"rating-desc" | "rating-asc" | "name-asc" | "name-desc" | "date-desc">("rating-desc");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync with LocalStorage on Mount (Client Only)
  useEffect(() => {
    const stored = localStorage.getItem("betvault_brands");
    
    const timer = setTimeout(() => {
      if (stored) {
        try {
          setBrands(JSON.parse(stored));
        } catch (e) {
          console.error("Error loading brands from storage:", e);
        }
      }
      setIsMounted(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  const saveBrands = (updatedBrands: Brand[]) => {
    setBrands(updatedBrands);
    localStorage.setItem("betvault_brands", JSON.stringify(updatedBrands));
  };

  // Add Brand
  const handleAddBrand = (newBrandData: Omit<Brand, "id" | "createdAt">) => {
    const newBrand: Brand = {
      ...newBrandData,
      id: `brand-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newBrand, ...brands];
    saveBrands(updated);
  };

  // Delete Brand
  const handleDeleteBrand = (id: string) => {
    const updated = brands.filter((brand) => brand.id !== id);
    saveBrands(updated);
  };

  // Toggle Visibility
  const handleToggleVisibility = (id: string) => {
    const updated = brands.map((brand) =>
      brand.id === id
        ? {
            ...brand,
            visibility: (brand.visibility === "visible" ? "hidden" : "visible") as "visible" | "hidden",
          }
        : brand
    );
    saveBrands(updated);
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
    if (visibilityFilter !== "all") {
      result = result.filter((b) => b.visibility === visibilityFilter);
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

  // Hydration safeguard: Render layout skeleton during server build/initial hydration
  if (!isMounted) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.titleArea}>
            <h1 className={styles.title}>BetVault Admin</h1>
            <span className={styles.subtitle}>Loading dashboard metrics...</span>
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
          <h1 className={styles.title}>BetVault Admin</h1>
          <span className={styles.subtitle}>
            Manage, filter, and track casino and sportsbook operators
          </span>
        </div>
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
          Add Operator
        </button>
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
            <option value="all">🌍 All Countries</option>
            {allLocations.map((loc) => (
              <option key={loc} value={loc}>
                📍 {loc}
              </option>
            ))}
          </select>

          {/* Visibility Status Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as "all" | "visible" | "hidden")}
            className={styles.filterSelect}
          >
            <option value="all">👁️ All Statuses</option>
            <option value="visible">🟢 Visible Only</option>
            <option value="hidden">🔴 Hidden Only</option>
          </select>
        </div>

        {/* Tab Row & Sorting */}
        <div className={styles.filterRow}>
          {/* Operator Category Tabs */}
          <div className={styles.tabs}>
            <button
              onClick={() => setTypeFilter("all")}
              className={`${styles.tab} ${typeFilter === "all" ? styles.tabActive : ""}`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter("casino")}
              className={`${styles.tab} ${
                typeFilter === "casino" ? styles.tabCasinoActive : ""
              }`}
            >
              🎰 Casinos
            </button>
            <button
              onClick={() => setTypeFilter("sportsbook")}
              className={`${styles.tab} ${
                typeFilter === "sportsbook" ? styles.tabSportsbookActive : ""
              }`}
            >
              ⚽ Sportsbooks
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
              <option value="rating-desc">⭐ Rating: High to Low</option>
              <option value="rating-asc">⭐ Rating: Low to High</option>
              <option value="name-asc">🔤 Name: A to Z</option>
              <option value="name-desc">🔤 Name: Z to A</option>
              <option value="date-desc">📅 Date Added: Newest</option>
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
          <h3 className={styles.emptyTitle}>No Operators Found</h3>
          <p className={styles.emptyDesc}>
            We couldn&apos;t find any casinos or sportsbooks matching your active search filters or
            selected location. Try widening your criteria.
          </p>
          <button className={styles.resetBtn} onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      )}

      {/* Add Operator Modal */}
      {isModalOpen && (
        <AddBrandModal onClose={() => setIsModalOpen(false)} onAdd={handleAddBrand} />
      )}
    </div>
  );
}
