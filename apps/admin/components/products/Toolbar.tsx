import { X } from "lucide-react";
import styles from "../styles/ProductsPage.module.css";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  discounted?: number;
  image: string;
  category?: string;
  categoryId?: string;
  createdAt?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

interface ToolbarProps {
  products: Product[];
  isLoading: boolean;
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  minPrice: string;
  maxPrice: string;
  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;
}

export function Toolbar({
  products,
  isLoading,
  categories,
  selectedCategory,
  setSelectedCategory,
  search,
  setSearch,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice
}: ToolbarProps) {
  return (
    <div className={styles.ppToolbar}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span className={styles.ppCount}>{isLoading ? "—" : products.length}</span>
        <span className={styles.ppCountLabel}>
          {products.length === 1 ? "product" : "products"}
        </span>
      </div>

      <div className={styles.ppDividerV} />

      {/* Category pills - scrollable */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, flexWrap: "nowrap" }}>
        <button 
          className={`${styles.ppPill} ${selectedCategory === "all" ? styles.ppPillActive : styles.ppPillInactive}`} 
          onClick={() => setSelectedCategory("all")}
        >
          All
        </button>
        {categories.map((c) => (
          <button 
            key={c.id} 
            className={`${styles.ppPill} ${selectedCategory === c.id ? styles.ppPillActive : styles.ppPillInactive}`} 
            onClick={() => setSelectedCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Active filter tags */}
      {search && (
        <button className={styles.ppTag} onClick={() => setSearch("")}>
          &quot;{search}&quot; <X size={11} />
        </button>
      )}
      {(minPrice || maxPrice) && (
        <button 
          className={styles.ppTag} 
          onClick={() => { 
            setMinPrice(""); 
            setMaxPrice(""); 
          }}
        >
          {minPrice ? `$${minPrice}` : "$0"} – {maxPrice ? `$${maxPrice}` : "any"} <X size={11} />
        </button>
      )}
    </div>
  );
}
