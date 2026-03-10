import { motion } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { RotateCcw } from "lucide-react";
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

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  resetFilters: () => void;
}

export function ProductGrid({ products, isLoading, resetFilters }: ProductGridProps) {
  return (
    <div className={styles.ppGrid}>
      {isLoading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.ppSkeleton} style={{ aspectRatio: "3/4" }} />
        ))
      ) : products.length > 0 ? (
        products.map((product: Product, i: number) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4) }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))
      ) : (
        <div className={styles.ppEmpty}>
          <div className={styles.ppEmptyIcon}>
            <RotateCcw size={28} />
          </div>
          <h3>No Products Found</h3>
          <p>Try adjusting your filters or clearing them to see more results.</p>
          <button className={styles.ppEmptyBtn} onClick={resetFilters}>
            <RotateCcw size={13} /> Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
