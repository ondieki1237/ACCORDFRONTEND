"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, ShoppingCart, Tag, Building2, CheckCircle2, XCircle } from "lucide-react"
import { QuotationForm } from "@/components/quotations/quotation-form"

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

interface ProductDetailProps {
  product: Product
  onBack: () => void
}

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [showQuotationForm, setShowQuotationForm] = useState(false)

  const formatPrice = (price: string) => {
    const priceNum = parseFloat(price)
    return priceNum.toLocaleString("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    })
  }

  const savings = product.reduced_price
    ? parseFloat(product.price) - parseFloat(product.reduced_price)
    : 0

  // Show quotation form if requested
  if (showQuotationForm) {
    return (
      <QuotationForm
        product={{
          id: product.id,
          name: product.name,
          price: product.reduced_price || product.price,
          category: product.category,
          brand: product.brand,
        }}
        onBack={() => setShowQuotationForm(false)}
        onSuccess={() => {
          setShowQuotationForm(false)
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        {product.featured && (
          <Badge className="bg-yellow-400 text-yellow-900 border-0">⭐ Featured Product</Badge>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardContent className="p-0">
              {product.images && product.images.length > 0 ? (
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={product.images[selectedImage].url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-2xl py-2 px-6">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Package className="h-32 w-32 text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <Card
                  key={index}
                  className={`rounded-xl overflow-hidden cursor-pointer transition-all ${selectedImage === index
                    ? "ring-4 ring-[#00aeef]"
                    : "hover:ring-2 ring-gray-300"
                    }`}
                  onClick={() => setSelectedImage(index)}
                  style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
                >
                  <CardContent className="p-0">
                    <img
                      src={image.thumbnail || image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          {/* Title and Category */}
          <div>
            <Badge variant="outline" className="rounded-lg mb-3">
              {product.category}
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              {product.name}
            </h1>
            {product.brand && (
              <p className="text-lg text-gray-600 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span className="font-semibold">Brand:</span> {product.brand}
              </p>
            )}
          </div>

          {/* Pricing Card */}
          <Card
            className="rounded-3xl bg-gradient-to-br from-[#00aeef] to-[#0096d6] border-0 overflow-hidden"
            style={{
              boxShadow: "12px 12px 24px rgba(0, 174, 239, 0.3), -12px -12px 24px rgba(255, 255, 255, 0.9)",
            }}
          >
            <CardContent className="p-6 text-white">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-sm text-white/80 mb-1">Price</p>
                  {product.reduced_price ? (
                    <div>
                      <p className="text-4xl font-bold">{formatPrice(product.reduced_price)}</p>
                      <p className="text-lg line-through text-white/60 mt-1">
                        {formatPrice(product.price)}
                      </p>
                      <Badge className="mt-2 bg-red-500 border-0">
                        Save {formatPrice(savings.toString())}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-4xl font-bold">{formatPrice(product.price)}</p>
                  )}
                </div>
                <div className="text-right">
                  <Tag className="h-12 w-12 text-white/40" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability Status */}
          <Card
            className="rounded-2xl bg-white border-0"
            style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold">Availability</span>
                {product.in_stock ? (
                  <Badge className="bg-green-100 text-green-800 border-0 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Out of Stock
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card
            className="rounded-3xl bg-white border-0"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="h-6 w-6 text-[#00aeef]" />
                Product Description
              </h2>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              className="h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r from-[#00aeef] to-[#0096d6] text-white shadow-xl hover:shadow-2xl transition-all duration-300"
              disabled={!product.in_stock}
              onClick={() => setShowQuotationForm(true)}
              style={{
                boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.8)",
              }}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Request Quote
            </Button>
            <Button
              variant="outline"
              className="h-14 rounded-2xl text-lg font-semibold border-2 shadow-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              onClick={async () => {
                const shareUrl = `https://accordmedical.co.ke/product/${product.slug}`
                try {
                  const { Share } = await import('@capacitor/share')
                  await Share.share({
                    title: product.name,
                    text: `Check out ${product.name} on Accord Medical Supplies`,
                    url: shareUrl,
                    dialogTitle: 'Share Product',
                  })
                } catch (error) {
                  console.error('Error sharing:', error)
                  // Fallback for Web/PWA
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
                      text: `Check out ${product.name} on Accord Medical Supplies`,
                      url: shareUrl
                    }).catch(() => {
                      // Silently fail if share rejected
                    })
                  } else {
                    // Final fallback: Copy to clipboard
                    try {
                      await navigator.clipboard.writeText(shareUrl)
                      alert("Link copied to clipboard!")
                    } catch (err) {
                      window.open(shareUrl, '_blank')
                    }
                  }
                }
              }}
            >
              Share Product
            </Button>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <Card
        className="rounded-3xl bg-white border-0"
        style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
      >
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Product Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Product ID</span>
              <span className="font-semibold text-gray-800">{product.id}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Category</span>
              <span className="font-semibold text-gray-800">{product.category}</span>
            </div>
            {product.brand && (
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Brand</span>
                <span className="font-semibold text-gray-800">{product.brand}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Currency</span>
              <span className="font-semibold text-gray-800">{product.currency}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card
        className="rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 border-0"
        style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
      >
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-800 mb-2">Need More Information?</h3>
          <p className="text-gray-600 text-sm mb-4">
            Contact our sales team for detailed specifications, bulk pricing, or installation services.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-lg">📧 info@accordmedical.co.ke</Badge>
            <Badge variant="secondary" className="rounded-lg">🌐 accordmedical.co.ke</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
