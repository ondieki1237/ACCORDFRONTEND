"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Package, Filter, X, RefreshCw, Wifi, WifiOff, Clock, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Consumable {
  _id: string
  name: string
  category: string
  brand?: string
  price: number
  unit: string
  description?: string
  inStock?: boolean
  lastUpdated?: string
}

const API_BASE = "http://localhost:4500/api"

export function ConsumablesList() {
  const [consumables, setConsumables] = useState<Consumable[]>([])
  const [filteredConsumables, setFilteredConsumables] = useState<Consumable[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name")
  const { toast } = useToast()

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      toast({
        title: "Back Online",
        description: "Connection restored. Refreshing data...",
      })
      fetchConsumables()
    }
    const handleOffline = () => {
      setIsOffline(true)
      toast({
        title: "Offline Mode",
        description: "Showing cached consumables data.",
        variant: "destructive",
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchConsumables()
  }, [])

  // Filter and sort whenever dependencies change
  useEffect(() => {
    filterAndSort()
  }, [consumables, searchQuery, selectedCategory, sortBy])

  const fetchConsumables = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem("accessToken")
      
      const response = await fetch(`${API_BASE}/consumables`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch consumables")
      }

      const data = await response.json()
      const consumablesData = data?.data || []
      
      setConsumables(Array.isArray(consumablesData) ? consumablesData : [])
      
      // Extract unique categories
      const uniqueCategories = [
        ...new Set(consumablesData.map((c: Consumable) => c.category).filter(Boolean)),
      ]
      setCategories(uniqueCategories as string[])

      toast({
        title: "Consumables loaded",
        description: `${consumablesData.length} items available`,
      })
    } catch (error) {
      console.error("Failed to fetch consumables:", error)
      toast({
        title: "Error",
        description: isOffline
          ? "Cannot load consumables while offline"
          : "Failed to load consumables. Please try again.",
        variant: "destructive",
      })
      setConsumables([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const filterAndSort = () => {
    let filtered = [...consumables]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.category?.toLowerCase().includes(query) ||
          c.brand?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((c) => c.category === selectedCategory)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "category":
          return (a.category || "").localeCompare(b.category || "")
        default:
          return 0
      }
    })

    setFilteredConsumables(filtered)
  }

  const handleRefresh = () => {
    if (isOffline) {
      toast({
        title: "Cannot Refresh",
        description: "Please connect to internet to refresh data.",
        variant: "destructive",
      })
      return
    }
    setIsRefreshing(true)
    fetchConsumables()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSortBy("name")
  }

  if (isLoading && consumables.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-gray-100 shadow-inner animate-pulse"
            style={{ boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff" }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Indicator */}
      {isOffline && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 border-2 border-orange-200 rounded-xl">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-700 font-medium">
            Offline Mode - Showing cached data
          </span>
        </div>
      )}

      {/* Search and Filters */}
      <Card
        className="bg-white rounded-2xl border-0 shadow-lg"
        style={{ boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)" }}
      >
        <CardContent className="p-4 space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search consumables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1 min-w-[140px] h-10 rounded-xl border-2 border-gray-200">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1 min-w-[140px] h-10 rounded-xl border-2 border-gray-200">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-low">Price (Low-High)</SelectItem>
                <SelectItem value="price-high">Price (High-Low)</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-10 px-4 rounded-xl border-2 border-gray-200 hover:border-[#00aeef]"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isOffline}
              className="h-10 px-4 rounded-xl border-2 border-gray-200 hover:border-[#00aeef]"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredConsumables.length} of {consumables.length} items
            </span>
            {!isOffline && (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="h-3 w-3" />
                <span className="text-xs">Online</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consumables List */}
      {filteredConsumables.length === 0 ? (
        <Card
          className="rounded-2xl bg-gray-50 p-6"
          style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <Package className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-center">
              {searchQuery || selectedCategory !== "all"
                ? "No consumables match your filters"
                : "No consumables available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredConsumables.map((consumable) => (
            <Card
              key={consumable._id}
              className="bg-white rounded-2xl border-0 shadow-md hover:shadow-xl transition-all duration-300"
              style={{ boxShadow: "6px 6px 12px rgba(0, 174, 239, 0.1), -6px -6px 12px rgba(255, 255, 255, 0.9)" }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="bg-gradient-to-br from-[#00aeef]/10 to-[#00aeef]/5 rounded-xl p-3 flex-shrink-0">
                        <Package className="h-6 w-6 text-[#00aeef]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 text-base mb-1 truncate">
                          {consumable.name}
                        </h3>
                        {consumable.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {consumable.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {consumable.category && (
                            <span className="bg-[#00aeef]/10 text-[#00aeef] px-2 py-1 rounded-lg font-medium">
                              {consumable.category}
                            </span>
                          )}
                          {consumable.brand && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                              {consumable.brand}
                            </span>
                          )}
                          {consumable.inStock !== undefined && (
                            <span
                              className={`px-2 py-1 rounded-lg font-medium ${
                                consumable.inStock
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {consumable.inStock ? "In Stock" : "Out of Stock"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Price */}
                  <div className="flex flex-col items-end justify-center gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Ksh</span>
                      <span className="text-xl font-bold text-[#00aeef]">
                        {consumable.price.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      per {consumable.unit}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Last Updated */}
      {consumables.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-2">
          <Clock className="h-3 w-3" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}
