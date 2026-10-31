const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')

export type Role = 'customer' | 'admin'

export type User = {
  id: string
  name: string
  email: string
  role: Role
}

export type Product = {
  id: string
  sku: string
  name: string
  description: string
  stock: number
  price: number
  category: string
  badge: string
  imageUrl?: string
  isActive: boolean
}

export type Order = {
  id: string
  customer: string
  customerId: string
  total: string
  status: string
  eta: string
  item: string
  items: { productId: string; name: string; quantity: number; unitPrice: number }[]
}

export type Policy = {
  id: string
  title: string
  detail: string
  category: string
  isActive: boolean
}

export type Conversation = {
  id: string
  title: string
  lastMessageAt: string
}

export type ChatMessage = {
  id: string
  sender: 'user' | 'assistant'
  text: string
  createdAt: string
}

export type AdminDashboard = {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  totalOrders: number
  totalConversations: number
  recentOrders: Order[]
}

type AuthResponse = {
  token: string
  user: User
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, cache: 'no-store' })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || `Request failed (${response.status})`)
  }

  return payload as T
}

async function uploadProductImage(file: File, token: string): Promise<{ imageUrl: string }> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_BASE_URL}/products/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.message || `Image upload failed (${response.status})`)
  }

  return payload as { imageUrl: string }
}

export const api = {
  getAssetUrl: (imageUrl?: string) =>
    imageUrl ? new URL(imageUrl, `${API_BASE_URL}/`).toString() : '',
  getHealth: () => request<{ status: string }>('/health'),
  getProducts: (token?: string, search?: string) =>
    request<Product[]>(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`, {}, token),
  getPolicies: (token?: string) => request<Policy[]>('/policies', {}, token),
  getOrders: (token: string) => request<Order[]>('/orders', {}, token),
  getAdminDashboard: (token: string) => request<AdminDashboard>('/admin/dashboard', {}, token),
  getConversations: (token: string, page = 1) =>
    request<{ items: Conversation[]; page: number; limit: number; total: number; pages: number }>(
      `/conversations?page=${page}&limit=20`,
      {},
      token,
    ),
  getConversationMessages: (id: string, token: string) =>
    request<{ conversation: Conversation; messages: ChatMessage[] }>(
      `/conversations/${encodeURIComponent(id)}/messages`,
      {},
      token,
    ),
  deleteConversation: (id: string, token: string) =>
    request<{ message: string }>(`/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),
  getCurrentUser: (token: string) => request<{ user: User }>('/auth/me', {}, token),
  logout: (token: string) => request<{ message: string }>('/auth/logout', { method: 'POST' }, token),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  ask: (question: string, token?: string, conversationId?: string) =>
    request<{ answer: string; role: string; conversationId: string | null }>(
      '/chat',
      {
        method: 'POST',
        body: JSON.stringify({ question, conversationId }),
      },
      token,
    ),
  createProduct: (
    product: Pick<Product, 'name' | 'category' | 'stock' | 'price' | 'badge'> &
      Partial<Pick<Product, 'sku' | 'description' | 'imageUrl'>>,
    token: string,
  ) =>
    request<Product>(
      '/products',
      {
        method: 'POST',
        body: JSON.stringify(product),
      },
      token,
    ),
  updateProduct: (
    id: string,
    product: Partial<Pick<Product, 'sku' | 'name' | 'description' | 'category' | 'stock' | 'price' | 'badge' | 'imageUrl' | 'isActive'>>,
    token: string,
  ) =>
    request<Product>(
      `/products/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(product),
      },
      token,
    ),
  deactivateProduct: (id: string, token: string) =>
    request<Product>(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),
  updateOrderStatus: (id: string, status: string, eta: string, token: string) =>
    request<Order>(
      `/orders/${encodeURIComponent(id)}/status`,
      { method: 'PATCH', body: JSON.stringify({ status, eta }) },
      token,
    ),
  createPolicy: (policy: Pick<Policy, 'title' | 'detail' | 'category'>, token: string) =>
    request<Policy>('/policies', { method: 'POST', body: JSON.stringify(policy) }, token),
  updatePolicy: (id: string, policy: Partial<Pick<Policy, 'title' | 'detail' | 'category' | 'isActive'>>, token: string) =>
    request<Policy>(`/policies/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(policy) }, token),
  deactivatePolicy: (id: string, token: string) =>
    request<Policy>(`/policies/${encodeURIComponent(id)}`, { method: 'DELETE' }, token),
  uploadProductImage,
}
