import { Search, X, SlidersHorizontal } from "lucide-react";
import styles from "../styles/ProductsPage.module.css";

interface SearchBarProps {
  search: string;
  setSearch: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  hasActiveFilters: boolean;
}

export function SearchBar({ search, setSearch, showFilters, setShowFilters, hasActiveFilters }: SearchBarProps) {
  return (
    <div style={{ display: "flex", gap: 10, flex: "0 0 auto", width: "100%", maxWidth: 480 }}>
      <div className={styles.ppSearch} style={{ flex: 1 }}>
        <span className={styles.ppSearchIcon}>
          <Search size={16} />
        </span>
        <input
          className={styles.ppSearchInput}
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button 
            onClick={() => setSearch("")} 
            className={styles.ppSearchClear}
          >
            <X size={14} />
          </button>
        )}
      </div>
      <button
        className={`${styles.ppFilterBtn} ${showFilters ? styles.ppFilterBtnOn : styles.ppFilterBtnOff}`}
        onClick={() => setShowFilters(!showFilters)}
      >
        <SlidersHorizontal size={14} />
        Filters
        {hasActiveFilters && !showFilters && (
          <span className={styles.ppFilterIndicator} />
        )}
      </button>
    </div>
  );
}
