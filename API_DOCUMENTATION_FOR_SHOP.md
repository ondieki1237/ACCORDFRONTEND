# Accord Medical API Documentation v1.0

## Base URL
**Production:** `https://events.codewithseth.co.ke/api/v1`  
**Local Development:** `http://localhost:5500/api/v1`

## Overview
The Accord Medical API provides programmatic access to our comprehensive catalog of medical equipment, laboratory supplies, and hospital furniture. This RESTful API allows external applications to query products, filter by categories, search, and retrieve pricing information.

## Authentication
Currently, the API is **publicly accessible** without authentication. Rate limiting is applied at **100 requests per 15 minutes** per IP address.

## Response Format
All API responses follow a consistent JSON format:

### Success Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "total_pages": 3
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```

## Available Endpoints

---

## 1. Get All Products

Retrieve a list of all products with optional filtering, sorting, and pagination.

### Endpoint
```
GET /api/v1/products
```

### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `category` | string | No | Filter by category name | `Laboratory Equipment` |
| `brand` | string | No | Filter by brand/manufacturer | `Philips` |
| `featured` | boolean | No | Filter featured products only | `true` |
| `min_price` | number | No | Minimum price filter (in KES) | `1000` |
| `max_price` | number | No | Maximum price filter (in KES) | `50000` |
| `search` | string | No | Search in name, description, category | `ultrasound` |
| `sort_by` | string | No | Sort field: `name`, `price`, `category` | `price` |
| `sort_order` | string | No | Sort order: `asc` or `desc` | `desc` |
| `page` | number | No | Page number (default: 1) | `2` |
| `limit` | number | No | Items per page (default: 50, max: 100) | `20` |

### Example Request
```bash
curl -X GET "https://events.codewithseth.co.ke/api/v1/products?category=Laboratory Equipment&sort_by=price&sort_order=asc&limit=10"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "12345",
      "name": "Digital Microscope DM-500",
      "slug": "digital-microscope-dm-500",
      "description": "High-resolution digital microscope with 5MP camera",
      "category": "Laboratory Equipment",
      "brand": "Olympus",
      "price": "45000.00",
      "reduced_price": "42000.00",
      "currency": "KES",
      "images": [
        {
          "url": "https://accordmedical.co.ke/web/uploads/shop/microscope.jpg",
          "thumbnail": "https://accordmedical.co.ke/web/uploads/shop/microscope_thumb.jpg"
        }
      ],
      "featured": true,
      "in_stock": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-10-20T14:22:00Z"
    }
  ],
  "pagination": {
    "total": 48,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  }
}
```

---

## 2. Get Single Product

Retrieve detailed information about a specific product.

### Endpoint
```
GET /api/v1/products/:id
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Product ID |

### Example Request
```bash
curl -X GET "https://events.codewithseth.co.ke/api/v1/products/12345"
```

### Example Response
```json
{
  "success": true,
  "data": {
    "id": "12345",
    "name": "Digital Microscope DM-500",
    "slug": "digital-microscope-dm-500",
    "description": "High-resolution digital microscope with 5MP camera, LED illumination, and USB connectivity for lab analysis",
    "category": "Laboratory Equipment",
    "brand": "Olympus",
    "price": "45000.00",
    "reduced_price": "42000.00",
    "currency": "KES",
    "images": [
      {
        "url": "https://accordmedical.co.ke/web/uploads/shop/microscope.jpg",
        "thumbnail": "https://accordmedical.co.ke/web/uploads/shop/microscope_thumb.jpg"
      }
    ],
    "featured": true,
    "in_stock": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-10-20T14:22:00Z"
  }
}
```

---

## 3. Get All Categories

Retrieve a list of all product categories with product counts.

### Endpoint
```
GET /api/v1/categories
```

### Example Request
```bash
curl -X GET "https://events.codewithseth.co.ke/api/v1/categories"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "name": "Laboratory Equipment",
      "count": 48,
      "slug": "laboratory-equipment"
    },
    {
      "name": "Maternity Equipment",
      "count": 32,
      "slug": "maternity-equipment"
    },
    {
      "name": "Diagnostic Products",
      "count": 56,
      "slug": "diagnostic-products"
    }
  ],
  "total": 12
}
```

---

## 4. Get Products by Category

Retrieve all products within a specific category.

### Endpoint
```
GET /api/v1/categories/:slug/products
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Category slug (lowercase, hyphenated) |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sort_by` | string | No | Sort field: `name`, `price` |
| `sort_order` | string | No | Sort order: `asc` or `desc` |
| `page` | number | No | Page number |
| `limit` | number | No | Items per page |

### Example Request
```bash
curl -X GET "https://events.codewithseth.co.ke/api/v1/categories/laboratory-equipment/products?page=1&limit=20"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "12345",
      "name": "Digital Microscope DM-500",
      "price": "45000.00",
      "category": "Laboratory Equipment"
    }
  ],
  "category": {
    "name": "Laboratory Equipment",
    "slug": "laboratory-equipment"
  },
  "pagination": {
    "total": 48,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

---

## 5. Get All Brands

Retrieve a list of all product brands/manufacturers.

### Endpoint
```
GET /api/v1/brands
```

### Example Request
```bash
curl -X GET "https://events.codewithseth.co.ke/api/v1/brands"
```

### Example Response
```json
{
  "success": true,
  "data": [
    "GE Healthcare",
    "Mindray",
    "Olympus",
    "Philips",
    "Siemens"
  ],
  "total": 5
}
```

---

## 6. Search Products

Search for products across name, description, category, and brand.

### Endpoint
```
GET /api/v1/search
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `limit` | number | No | Maximum results (default: 20) |

### Example Request
```bash
curl -X GET "https://events.codewithseth.co.ke/api/v1/search?q=ultrasound&limit=10"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "67890",
      "name": "Ultrasound Machine US-3000",
      "description": "Portable ultrasound with 3D/4D imaging",
      "category": "Imaging Equipment",
      "price": "125000.00"
    }
  ],
  "query": "ultrasound",
  "total": 8
}
```

---

## HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `400` | Bad Request - Invalid parameters |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Headers:** Response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## CORS Policy

The API supports Cross-Origin Resource Sharing (CORS) from all origins (`*`). Allowed methods: GET, POST, PUT, DELETE, PATCH, OPTIONS.

---

## Code Examples

### JavaScript (Fetch API)
```javascript
// Get all products in Laboratory Equipment category
async function getLabProducts() {
  const response = await fetch(
    'https://events.codewithseth.co.ke/api/v1/products?category=Laboratory Equipment&limit=20'
  );
  const data = await response.json();
  
  if (data.success) {
    console.log('Products:', data.data);
    console.log('Total:', data.pagination.total);
  }
}

// Search for products
async function searchProducts(query) {
  const response = await fetch(
    `https://events.codewithseth.co.ke/api/v1/search?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  
  if (data.success) {
    console.log('Search results:', data.data);
  }
}
```

### Python (Requests)
```python
import requests

# Get products with price filter
def get_products_by_price(min_price, max_price):
    url = 'https://events.codewithseth.co.ke/api/v1/products'
    params = {
        'min_price': min_price,
        'max_price': max_price,
        'sort_by': 'price',
        'sort_order': 'asc'
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if data['success']:
        return data['data']
    return []

# Get single product
def get_product(product_id):
    url = f'https://events.codewithseth.co.ke/api/v1/products/{product_id}'
    response = requests.get(url)
    data = response.json()
    
    if data['success']:
        return data['data']
    return None
```

### PHP (cURL)
```php
<?php
// Get categories
function getCategories() {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://events.codewithseth.co.ke/api/v1/categories');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    if ($data['success']) {
        return $data['data'];
    }
    return [];
}

// Get products by category
function getProductsByCategory($categorySlug) {
    $url = "https://events.codewithseth.co.ke/api/v1/categories/{$categorySlug}/products";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}
?>
```

### React Example
```typescript
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: string;
  category: string;
  images: Array<{ url: string }>;
}

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch(
          'https://events.codewithseth.co.ke/api/v1/products?limit=20'
        );
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>KES {product.price}</p>
          {product.images[0] && (
            <img src={product.images[0].url} alt={product.name} />
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Data Models

### Product Object
```typescript
{
  id: string;              // Unique product identifier
  name: string;            // Product name
  slug: string;            // URL-friendly product identifier
  description: string;     // Product description (may contain HTML)
  category: string;        // Category name
  brand: string;           // Manufacturer/brand name
  price: string;           // Price in KES (decimal string)
  reduced_price: string | null; // Sale price if available
  currency: string;        // Always "KES" (Kenyan Shillings)
  images: Array<{
    url: string;           // Full-size image URL
    thumbnail: string;     // Thumbnail image URL
  }>;
  featured: boolean;       // Whether product is featured
  in_stock: boolean;       // Availability status
  created_at?: string;     // ISO 8601 timestamp
  updated_at?: string;     // ISO 8601 timestamp
}
```

### Category Object
```typescript
{
  name: string;     // Category display name
  count: number;    // Number of products in category
  slug: string;     // URL-friendly category identifier
}
```

---

## Available Categories

1. Laboratory Equipment
2. Maternity Equipment
3. Diagnostic Products
4. Imaging Equipment
5. Theatre & ICU Equipment
6. Hospital Furniture
7. Renal Equipment
8. Dental Equipment
9. Cold Chain
10. CSSD
11. Homecare Equipment
12. Medical Training Materials

---

## Support

For API support, technical questions, or partnership inquiries:

- **Email:** info@accordmedical.co.ke
- **Website:** https://accordmedical.co.ke
- **API Base URL:** https://events.codewithseth.co.ke/api/v1

---

## Changelog

### Version 1.0.0 (2025-10-29)
- Initial API release
- Product listing with filtering and sorting
- Category and brand endpoints
- Search functionality
- Pagination support
- Price filtering
- Full product details with images

---

## Best Practices

1. **Cache responses** where appropriate to reduce API calls
2. **Handle rate limits** gracefully with exponential backoff
3. **Validate data** on your end before displaying
4. **Use pagination** for large result sets
5. **Filter on server** rather than fetching all data and filtering client-side
6. **Handle errors** with proper user feedback
7. **Keep search queries** specific for better performance

---

*Last Updated: October 29, 2025*
