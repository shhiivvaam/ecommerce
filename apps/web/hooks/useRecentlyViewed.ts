import { useState, useEffect } from 'react';

const RECENTLY_VIEWED_KEY = 'recently_viewed_products';
const MAX_ITEM_COUNT = 10;

export function useRecentlyViewed() {
    const [recentProductIds, setRecentProductIds] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
            if (stored) {
                setRecentProductIds(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Error reading recently viewed from localStorage', e);
        }
    }, []);

    const addRecentlyViewed = (productId: string) => {
        setRecentProductIds((prev) => {
            // Remove it if it exists so we can bump it to the front
            const filtered = prev.filter((id) => id !== productId);
            // Add to front
            const updated = [productId, ...filtered].slice(0, MAX_ITEM_COUNT);

            try {
                localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
            } catch (e) {
                console.error('Error saving recently viewed to localStorage', e);
            }

            return updated;
        });
    };

    const clearRecentlyViewed = () => {
        setRecentProductIds([]);
        try {
            localStorage.removeItem(RECENTLY_VIEWED_KEY);
        } catch (e) {
            console.error('Error clearing recently viewed from localStorage', e);
        }
    };

    return { recentProductIds, addRecentlyViewed, clearRecentlyViewed };
}
