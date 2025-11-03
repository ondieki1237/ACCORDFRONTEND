"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Eye, Search, ShoppingCart, Package, Filter, X, Download, RefreshCw, Wifi, WifiOff, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { productStorage } from "@/lib/product-storage"

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

interface ProductListProps {
  onViewProduct: (product: Product) => void
}

const API_BASE = "https://events.codewithseth.co.ke/api/v1"

export function ProductList({ onViewProduct }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([]) // For offline filtering
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const { toast } = useToast()

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Load last sync time on mount
  useEffect(() => {
    loadLastSyncTime()
  }, [])

  // Fetch data on mount
  useEffect(() => {
    initializeData()
  }, [])

  // Filter/sort products when filters change (offline mode)
  useEffect(() => {
    if (isOffline) {
      filterAndSortOffline()
    } else {
      fetchProducts()
    }
  }, [selectedCategory, sortBy, searchQuery, isOffline])

  const loadLastSyncTime = async () => {
    const syncTime = await productStorage.getLastSyncTime()
    setLastSyncTime(syncTime)
  }

  const initializeData = async () => {
    try {
      setIsLoading(true)

      // Try to load from cache first
      const cachedProducts = await productStorage.getProducts()
      const cachedCategories = await productStorage.getCategories()

      if (cachedProducts.length > 0) {
        setAllProducts(cachedProducts)
        setProducts(cachedProducts)
        setTotal(cachedProducts.length)
      }

      if (cachedCategories.length > 0) {
        setCategories(cachedCategories)
      }

      // If online, fetch fresh data
      if (!isOffline) {
        await fetchCategories()
        await fetchProducts()
      } else if (cachedProducts.length === 0) {
        // No cache and offline - silently handle
        console.log('📵 Offline with no cached data')
        setProducts([])
        setTotal(0)
      }
    } catch (error) {
      console.error("Failed to initialize:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortOffline = async () => {
    try {
      setIsLoading(true)
      let filtered = [...allProducts]

      // Apply search
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase()
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery) ||
            p.brand.toLowerCase().includes(lowerQuery)
        )
      }

      // Apply category filter
      if (selectedCategory !== "all") {
        filtered = filtered.filter((p) => p.category === selectedCategory)
      }

      // Apply sorting
      filtered = productStorage.sortProducts(filtered, sortBy, "asc")

      setProducts(filtered)
      setTotal(filtered.length)
      setTotalPages(Math.ceil(filtered.length / 20))
    } catch (error) {
      console.error("Failed to filter offline:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadAllProducts = async () => {
    if (isOffline) {
      toast({
        title: "Cannot Download",
        description: "Please connect to internet to download products.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSyncing(true)
      toast({
        title: "Downloading Products",
        description: "Fetching all products for offline use...",
      })

      // Fetch all products (paginated)
      const allProductsData: Product[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response = await fetch(`${API_BASE}/products?page=${page}&limit=100`)
        const data = await response.json()

        if (data.success && data.data) {
          allProductsData.push(...data.data)

          if (data.pagination) {
            hasMore = page < data.pagination.total_pages
            page++
          } else {
            hasMore = false
          }
        } else {
          hasMore = false
        }
      }

      // Fetch categories
      const catResponse = await fetch(`${API_BASE}/categories`)
      const catData = await catResponse.json()
      const categoriesData = catData.success ? catData.data : []

      // Save to storage
      await productStorage.saveProducts(allProductsData)
      await productStorage.saveCategories(categoriesData)
      await productStorage.saveMetadata({
        lastSync: Date.now(),
        totalProducts: allProductsData.length,
        totalCategories: categoriesData.length,
        version: "1.0",
      })

      setAllProducts(allProductsData)
      setProducts(allProductsData)
      setCategories(categoriesData)
      setTotal(allProductsData.length)
      await loadLastSyncTime()

      const cacheSize = await productStorage.getCacheSize()

      toast({
        title: "Download Complete!",
        description: `${allProductsData.length} products saved (${cacheSize.toFixed(1)} KB). You can now browse offline.`,
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`)
      const data = await response.json()

      if (data.success) {
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      let url = `${API_BASE}/products?page=${currentPage}&limit=20&sort_by=${sortBy}&sort_order=asc`

      if (selectedCategory !== "all") {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }

      if (searchQuery.trim()) {
        url = `${API_BASE}/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data || [])
        if (data.pagination) {
          setTotalPages(data.pagination.total_pages)
          setTotal(data.pagination.total)
        } else if (data.total) {
          setTotal(data.total)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSortBy("name")
    setCurrentPage(1)
  }

  const formatPrice = (price: string, reducedPrice: string | null) => {
    const priceNum = parseFloat(price)
    const formattedPrice = priceNum.toLocaleString("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    })

    if (reducedPrice) {
      const reducedNum = parseFloat(reducedPrice)
      const formattedReduced = reducedNum.toLocaleString("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0,
      })
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-green-600">{formattedReduced}</span>
          <span className="text-sm line-through text-gray-400">{formattedPrice}</span>
        </div>
      )
    }

    return <span className="text-lg font-bold text-[#00aeef]">{formattedPrice}</span>
  }

  const truncateDescription = (desc: string, maxLength: number = 100) => {
    const stripped = desc.replace(/<[^>]*>/g, "") // Remove HTML tags
    if (stripped.length <= maxLength) return stripped
    return stripped.substring(0, maxLength) + "..."
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] rounded-3xl p-6 shadow-xl"
        style={{
          boxShadow: "12px 12px 24px rgba(0, 174, 239, 0.2), -12px -12px 24px rgba(255, 255, 255, 0.9)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Product Catalog</h2>
              <p className="text-white/90 text-sm">
                Browse {total} medical products and equipment
              </p>
              {lastSyncTime && (
                <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last synced: {lastSyncTime.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {/* Online/Offline Status */}
            <Badge 
              className={`${
                isOffline 
                  ? "bg-red-500 border-0" 
                  : "bg-green-500 border-0"
              } text-white flex items-center gap-1`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              ) : (
                <>
                  <Wifi className="h-3 w-3" />
                  Online
                </>
              )}
            </Badge>
            {/* Sync Button */}
            <Button
              onClick={downloadAllProducts}
              disabled={isSyncing || isOffline}
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded-xl"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Download All
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card
        className="rounded-2xl bg-white border-0"
        style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
      >
        <CardContent className="p-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.name}>
                      {cat.name} ({cat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price">Price (Low-High)</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="h-12 w-full rounded-xl border-2"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedCategory !== "all" || searchQuery) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="rounded-lg">
                  {selectedCategory}
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="rounded-lg">
                  Search: "{searchQuery}"
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 border-4 border-[#00aeef] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <Card
          className="rounded-2xl bg-white border-0"
          style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h3>
            <p className="text-gray-500 text-center">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "No products available at the moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="rounded-2xl bg-white border-0 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
              style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
              onClick={() => onViewProduct(product)}
            >
              {/* Product Image */}
              {product.images && product.images.length > 0 ? (
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.featured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 border-0">
                      ⭐ Featured
                    </Badge>
                  )}
                  {product.reduced_price && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white border-0">
                      Sale
                    </Badge>
                  )}
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-lg">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
              )}

              <CardContent className="p-4 space-y-3">
                {/* Category Badge */}
                <Badge variant="outline" className="rounded-lg text-xs">
                  {product.category}
                </Badge>

                {/* Product Name */}
                <h3 className="font-bold text-lg text-gray-800 line-clamp-2">{product.name}</h3>

                {/* Brand */}
                {product.brand && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Brand:</span> {product.brand}
                  </p>
                )}

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  {truncateDescription(product.description)}
                </p>

                {/* Price and Action */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>{formatPrice(product.price, product.reduced_price)}</div>
                  <Button
                    size="sm"
                    className="rounded-xl bg-[#00aeef] text-white hover:bg-[#0096d6]"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewProduct(product)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && products.length > 0 && totalPages > 1 && (
        <Card
          className="rounded-2xl bg-white border-0"
          style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              className="rounded-xl"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              className="rounded-xl"
            >
              Next
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
