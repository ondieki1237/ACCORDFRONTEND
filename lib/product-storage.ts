/**
 * Product Offline Storage Service
 * Caches products for offline browsing using Capacitor Preferences
 */

import { Preferences } from "@capacitor/preferences"

interface Product {
  id: string
  name: string
  slug: string
  description: string
  category: string
  brand: string
  price: string
  reduced_price: string | null
  currency: string
  images: Array<{
    url: string
    thumbnail: string
  }>
  featured: boolean
  in_stock: boolean
}

interface Category {
  name: string
  count: number
  slug: string
}

interface CacheMetadata {
  lastSync: number
  totalProducts: number
  totalCategories: number
  version: string
}

const KEYS = {
  PRODUCTS: "cached_products",
  CATEGORIES: "cached_categories",
  METADATA: "cache_metadata",
}

const CACHE_VERSION = "1.0"

class ProductStorageService {
  /**
   * Save products to local storage
   */
  async saveProducts(products: Product[]): Promise<void> {
    try {
      await Preferences.set({
        key: KEYS.PRODUCTS,
        value: JSON.stringify(products),
      })
    } catch (error) {
      console.error("Failed to save products:", error)
      throw error
    }
  }

  /**
   * Get cached products
   */
  async getProducts(): Promise<Product[]> {
    try {
      const { value } = await Preferences.get({ key: KEYS.PRODUCTS })
      if (!value) return []
      return JSON.parse(value)
    } catch (error) {
      console.error("Failed to get products:", error)
      return []
    }
  }

  /**
   * Save categories to local storage
   */
  async saveCategories(categories: Category[]): Promise<void> {
    try {
      await Preferences.set({
        key: KEYS.CATEGORIES,
        value: JSON.stringify(categories),
      })
    } catch (error) {
      console.error("Failed to save categories:", error)
      throw error
    }
  }

  /**
   * Get cached categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const { value } = await Preferences.get({ key: KEYS.CATEGORIES })
      if (!value) return []
      return JSON.parse(value)
    } catch (error) {
      console.error("Failed to get categories:", error)
      return []
    }
  }

  /**
   * Save cache metadata (last sync time, counts)
   */
  async saveMetadata(metadata: CacheMetadata): Promise<void> {
    try {
      await Preferences.set({
        key: KEYS.METADATA,
        value: JSON.stringify(metadata),
      })
    } catch (error) {
      console.error("Failed to save metadata:", error)
      throw error
    }
  }

  /**
   * Get cache metadata
   */
  async getMetadata(): Promise<CacheMetadata | null> {
    try {
      const { value } = await Preferences.get({ key: KEYS.METADATA })
      if (!value) return null
      return JSON.parse(value)
    } catch (error) {
      console.error("Failed to get metadata:", error)
      return null
    }
  }

  /**
   * Check if cache exists and is valid
   */
  async isCacheValid(): Promise<boolean> {
    const metadata = await this.getMetadata()
    if (!metadata) return false

    // Cache is valid if:
    // 1. Version matches
    // 2. Has products
    // 3. Has categories
    return (
      metadata.version === CACHE_VERSION &&
      metadata.totalProducts > 0 &&
      metadata.totalCategories > 0
    )
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<Date | null> {
    const metadata = await this.getMetadata()
    if (!metadata || !metadata.lastSync) return null
    return new Date(metadata.lastSync)
  }

  /**
   * Search products locally (offline)
   */
  async searchProducts(query: string): Promise<Product[]> {
    const products = await this.getProducts()
    if (!query.trim()) return products

    const lowerQuery = query.toLowerCase()

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery) ||
        product.category.toLowerCase().includes(lowerQuery) ||
        product.brand.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Filter products by category (offline)
   */
  async filterByCategory(category: string): Promise<Product[]> {
    const products = await this.getProducts()
    if (category === "all") return products
    return products.filter((product) => product.category === category)
  }

  /**
   * Sort products (offline)
   */
  sortProducts(products: Product[], sortBy: string, sortOrder: "asc" | "desc" = "asc"): Product[] {
    const sorted = [...products]

    switch (sortBy) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "price":
        sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        break
      case "category":
        sorted.sort((a, b) => a.category.localeCompare(b.category))
        break
      default:
        break
    }

    return sortOrder === "desc" ? sorted.reverse() : sorted
  }

  /**
   * Get single product by ID (offline)
   */
  async getProductById(id: string): Promise<Product | null> {
    const products = await this.getProducts()
    return products.find((p) => p.id === id) || null
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      await Preferences.remove({ key: KEYS.PRODUCTS })
      await Preferences.remove({ key: KEYS.CATEGORIES })
      await Preferences.remove({ key: KEYS.METADATA })
    } catch (error) {
      console.error("Failed to clear cache:", error)
      throw error
    }
  }

  /**
   * Get cache size estimate (in KB)
   */
  async getCacheSize(): Promise<number> {
    try {
      const productsValue = await Preferences.get({ key: KEYS.PRODUCTS })
      const categoriesValue = await Preferences.get({ key: KEYS.CATEGORIES })
      const metadataValue = await Preferences.get({ key: KEYS.METADATA })

      const productsSize = productsValue.value ? productsValue.value.length : 0
      const categoriesSize = categoriesValue.value ? categoriesValue.value.length : 0
      const metadataSize = metadataValue.value ? metadataValue.value.length : 0

      // Estimate: 1 char ≈ 2 bytes (UTF-16), convert to KB
      return ((productsSize + categoriesSize + metadataSize) * 2) / 1024
    } catch (error) {
      console.error("Failed to get cache size:", error)
      return 0
    }
  }
}

export const productStorage = new ProductStorageService()
