import { ChevronDown, ArrowUpDown, RotateCcw, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../styles/ProductsPage.module.css";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

interface FilterPanelProps {
  showFilters: boolean;
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  minPrice: string;
  setMinPrice: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  resetFilters: () => void;
  categoriesError: string | null;
  isRetryingCategories: boolean;
  fetchCategories: () => void;
}

export function FilterPanel({
  showFilters,
  categories,
  selectedCategory,
  setSelectedCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  resetFilters,
  categoriesError,
  isRetryingCategories,
  fetchCategories
}: FilterPanelProps) {
  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          className={styles.ppFilters}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: .3, ease: [.4, 0, .2, 1] }}
          style={{ overflow: "hidden" }}
        >
          <div className={styles.ppFiltersInner}>
            {/* Category */}
            <div>
              <span className={styles.ppLabel}>Category</span>
              {categoriesError ? (
                <div className={styles.ppCategoryError}>
                  <AlertCircle size={14} />
                  <span>{categoriesError}</span>
                  <button
                    onClick={fetchCategories}
                    disabled={isRetryingCategories}
                    className={styles.ppCategoryRetryBtn}
                  >
                    <RefreshCw 
                      size={12} 
                      className={isRetryingCategories ? styles.ppRetryIcon : ""} 
                    />
                    {isRetryingCategories ? "Retrying..." : "Retry"}
                  </button>
                </div>
              ) : (
                <div className={styles.ppSelectWrap}>
                  <select 
                    className={styles.ppSelect} 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">All Products</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className={styles.ppSelectChevron} />
                </div>
              )}
            </div>

            {/* Price range */}
            <div>
              <span className={styles.ppLabel}>Min Price</span>
              <input 
                className={styles.ppInput} 
                placeholder="$0" 
                type="number" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)} 
              />
            </div>
            <div>
              <span className={styles.ppLabel}>Max Price</span>
              <input 
                className={styles.ppInput} 
                placeholder="Any" 
                type="number" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)} 
              />
            </div>

            {/* Sort */}
            <div>
              <span className={styles.ppLabel}>Sort By</span>
              <div className={styles.ppSelectWrap}>
                <select 
                  className={styles.ppSelect} 
                  value={`${sortBy}-${sortOrder}`} 
                  onChange={(e) => { 
                    const [f, o] = e.target.value.split("-"); 
                    setSortBy(f); 
                    setSortOrder(o); 
                  }}
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="name-asc">Name: A–Z</option>
                  <option value="name-desc">Name: Z–A</option>
                </select>
                <ArrowUpDown size={14} className={styles.ppSelectChevron} />
              </div>
            </div>

            {/* Reset */}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className={styles.ppResetBtn} onClick={resetFilters}>
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
