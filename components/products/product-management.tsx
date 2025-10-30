"use client"

import { useState } from "react"
import { ProductList } from "./product-list"
import { ProductDetail } from "./product-detail"

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

type View = "list" | "detail"

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

  return (
    <div className="w-full">
      {currentView === "list" && <ProductList onViewProduct={handleViewProduct} />}
      {currentView === "detail" && selectedProduct && (
        <ProductDetail product={selectedProduct} onBack={handleBackToList} />
      )}
    </div>
  )
}
