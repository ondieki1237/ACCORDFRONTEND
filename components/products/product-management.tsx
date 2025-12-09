"use client"

import { useState } from "react"
import { ProductList } from "./product-list"
import { ProductDetail } from "./product-detail"
import { ConsumablesList } from "./consumables-list"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, ArrowLeft } from "lucide-react"

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

type View = "list" | "detail" | "consumables"

export function ProductManagement() {
  const [currentView, setCurrentView] = useState<View>("list")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setCurrentView("detail")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    setSelectedProduct(null)
  }

  const handleViewConsumables = () => {
    setCurrentView("consumables")
    setSelectedProduct(null)
  }

  return (
    <div className="w-full">
      {currentView === "list" && (
        <div className="space-y-4">
          {/* Consumables Button */}
          <div className="flex justify-end px-4">
            <Button
              onClick={handleViewConsumables}
              className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] hover:from-[#0096d6] hover:to-[#00aeef] text-white font-semibold shadow-lg rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105"
            >
              <Package className="w-5 h-5 mr-2" />
              View Consumables
            </Button>
          </div>
          <ProductList onViewProduct={handleViewProduct} />
        </div>
      )}
      {currentView === "detail" && selectedProduct && (
        <ProductDetail product={selectedProduct} onBack={handleBackToList} />
      )}
      {currentView === "consumables" && (
        <div className="space-y-4">
          {/* Back Button */}
          <div className="flex items-center gap-3 px-4">
            <Button
              onClick={handleBackToList}
              variant="outline"
              className="rounded-xl border-2 border-[#00aeef]/30 hover:border-[#00aeef] text-[#00aeef]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-6 h-6 text-[#00aeef]" />
              Consumables Price List
            </h2>
          </div>
          <ConsumablesList />
        </div>
      )}
    </div>
  )
}
