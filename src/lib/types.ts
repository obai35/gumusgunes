export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  icon: string | null
  parentId: string | null
  parent?: { id: string; name: string; slug: string } | null
  children?: Category[]
  _count?: { products: number }
}

export type Review = {
  id: string
  productId: string
  authorName: string
  authorEmail: string | null
  rating: number
  title: string
  comment: string
  isVerified: boolean
  createdAt: string
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice: number | null
  sku: string
  categoryId: string
  category?: Category
  imageUrl: string
  images: string
  material: string
  weight: string | null
  rating: number
  reviewCount: number
  stock: number
  tags: string
  isActive: boolean
  isFeatured: boolean
  isNew: boolean
  isBestseller: boolean
  createdAt: string
  reviews?: Review[]
}

export type CartItem = {
  product: Product
  quantity: number
}

export type OrderPayload = {
  email: string
  fullName: string
  phone?: string
  address: string
  city: string
  postalCode: string
  country: string
  notes?: string
  paymentMethod: 'card' | 'transfer' | 'cod'
  items: { productId: string; quantity: number; price: number }[]
  subtotal: number
  shipping: number
  tax: number
  totalAmount: number
}

export type Order = {
  id: string
  orderNumber: string
  email: string
  fullName: string
  phone: string | null
  address: string
  city: string
  postalCode: string
  country: string
  totalAmount: number
  subtotal: number
  shipping: number
  tax: number
  status: string
  paymentMethod: string
  notes: string | null
  items: {
    id: string
    productId: string
    quantity: number
    price: number
    product: Product
  }[]
  createdAt: string
}
