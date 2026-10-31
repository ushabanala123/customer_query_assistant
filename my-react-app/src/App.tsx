import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Package,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UploadCloud,
  UserRound,
} from 'lucide-react'
import type { AdminDashboard, Conversation, Order, Policy, Product, Role, User } from './api'
import { api } from './api'
import { AppSidebar, type AppView, type NavItem } from './components/AppSidebar'
import { AdminDashboard as AdminDashboardPage } from './components/AdminDashboard'
import { AuthPanel } from './components/AuthPanel'
import { ChatPanel, type ChatMessageView } from './components/ChatPanel'
import { CustomerDashboard } from './components/CustomerDashboard'
import { LandingPage } from './components/LandingPage'
import { OrderList } from './components/OrderList'
import { ProductCatalog } from './components/ProductCatalog'
import { ProductRows } from './components/ProductRows'

type ProductDraft = Pick<Product, 'sku' | 'name' | 'description' | 'category' | 'stock' | 'price' | 'badge' | 'imageUrl' | 'isActive'>

const TOKEN_KEY = 'queryflow.token'
const welcomeMessage: ChatMessageView = {
  id: 1,
  sender: 'assistant',
  text: 'Hi! I can help with product availability, your order status, returns, and store policies.',
}
const emptyProductDraft: ProductDraft = { sku: '', name: '', description: '', category: '', stock: 0, price: 0, badge: 'New', imageUrl: '', isActive: true }

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboard | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationPage, setConversationPage] = useState(1)
  const [conversationPages, setConversationPages] = useState(1)
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessageView[]>([welcomeMessage])
  const [view, setView] = useState<AppView>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [appError, setAppError] = useState('')
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting')
  const [search, setSearch] = useState('')
  const [question, setQuestion] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [productDraft, setProductDraft] = useState<ProductDraft>(emptyProductDraft)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [editingProductId, setEditingProductId] = useState('')
  const [productNotice, setProductNotice] = useState('')
  const [productBusy, setProductBusy] = useState(false)
  const [policyDraft, setPolicyDraft] = useState({ title: '', category: 'general', detail: '' })
  const [editingPolicyId, setEditingPolicyId] = useState('')
  const [policyNotice, setPolicyNotice] = useState('')
  const [orderNotice, setOrderNotice] = useState('')
  const [savingOrderId, setSavingOrderId] = useState('')

  const loadPublicData = useCallback(async () => {
    setLoading(true)
    setAppError('')
    try {
      const [, nextProducts, nextPolicies] = await Promise.all([
        api.getHealth(),
        api.getProducts(),
        api.getPolicies(),
      ])
      setProducts(nextProducts)
      setPolicies(nextPolicies)
      setApiStatus('connected')
    } catch (error) {
      setApiStatus('offline')
      setAppError(error instanceof Error ? error.message : 'Could not load storefront data.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPrivateData = useCallback(async (activeToken: string, activeUser: User) => {
    try {
      const [nextOrders, nextConversations, nextProducts, nextPolicies] = await Promise.all([
        api.getOrders(activeToken),
        activeUser.role === 'customer' ? api.getConversations(activeToken) : Promise.resolve(null),
        api.getProducts(activeToken),
        api.getPolicies(activeToken),
      ])
      setOrders(nextOrders)
      setProducts(nextProducts)
      setPolicies(nextPolicies)
      if (nextConversations) {
        setConversations(nextConversations.items)
        setConversationPages(nextConversations.pages)
      }
      if (activeUser.role === 'admin') {
        const dashboard = await api.getAdminDashboard(activeToken)
        setAdminDashboard(dashboard)
      }
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Could not load account data.')
    }
  }, [])

  useEffect(() => {
    void loadPublicData()
  }, [loadPublicData])

  useEffect(() => {
    if (!token) return
    let active = true
    api.getCurrentUser(token)
      .then(({ user: currentUser }) => {
        if (!active) return
        setUser(currentUser)
        void loadPrivateData(token, currentUser)
      })
      .catch(() => {
        if (!active) return
        localStorage.removeItem(TOKEN_KEY)
        setToken('')
        setUser(null)
        setOrders([])
        setConversations([])
      })
    return () => {
      active = false
    }
  }, [token, loadPrivateData])

  const isAdmin = user?.role === 'admin'
  const role: Role | null = user?.role ?? null
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((product) =>
      [product.name, product.sku, product.description, product.category, product.badge, product.id].join(' ').toLowerCase().includes(term),
    )
  }, [products, search])

  const inStockCount = products.filter((product) => product.isActive && product.stock > 0).length
  const lowStockProducts = products.filter((product) => product.isActive && product.stock > 0 && product.stock <= 12)

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      const response = authMode === 'register'
        ? await api.register(name.trim(), email.trim(), password)
        : await api.login(email.trim(), password)
      localStorage.setItem(TOKEN_KEY, response.token)
      setToken(response.token)
      setUser(response.user)
      setPassword('')
      setView('dashboard')
      setMessages([welcomeMessage])
      await loadPrivateData(response.token, response.user)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign in.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    if (token) void api.logout(token).catch((error) => console.error('Sign-out request failed:', error))
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setUser(null)
    setOrders([])
    setConversations([])
    setAdminDashboard(null)
    setProducts((current) => current.filter((product) => product.isActive))
    setPolicies((current) => current.filter((policy) => policy.isActive))
    setActiveConversationId('')
    setMobileMenuOpen(false)
    setView('dashboard')
    setMessages([welcomeMessage])
  }

  const handleChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const prompt = question.trim()
    if (!prompt || chatBusy) return
    setQuestion('')
    setChatBusy(true)
    setMessages((current) => [...current, { id: Date.now(), sender: 'user', text: prompt }])
    try {
      const response = await api.ask(prompt, token || undefined, activeConversationId || undefined)
      if (response.conversationId) setActiveConversationId(response.conversationId)
      setMessages((current) => [...current, { id: Date.now() + 1, sender: 'assistant', text: response.answer }])
      if (token && user) {
        const history = await api.getConversations(token)
        setConversations(history.items)
        setConversationPages(history.pages)
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, sender: 'assistant', text: error instanceof Error ? error.message : 'Please try again.' },
      ])
      setQuestion(prompt)
    } finally {
      setChatBusy(false)
    }
  }

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !isAdmin) return
    setProductBusy(true)
    setProductNotice('')
    try {
      let imageUrl = productDraft.imageUrl || ''
      if (selectedImage) {
        setProductNotice('Uploading product image…')
        const uploaded = await api.uploadProductImage(selectedImage, token)
        imageUrl = uploaded.imageUrl
      }

      const saved = editingProductId
        ? await api.updateProduct(editingProductId, { ...productDraft, imageUrl }, token)
        : await api.createProduct({ ...productDraft, imageUrl }, token)
      setProducts((current) => editingProductId
        ? current.map((product) => product.id === saved.id ? saved : product)
        : [saved, ...current])
      if (user) void loadPrivateData(token, user)
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
      setProductDraft(emptyProductDraft)
      setSelectedImage(null)
      setImagePreview(api.getAssetUrl(saved.imageUrl))
      setEditingProductId('')
      setProductNotice(editingProductId ? 'Product changes saved.' : 'Product added to the catalog.')
    } catch (error) {
      setProductNotice(error instanceof Error ? error.message : 'Could not save product.')
    } finally {
      setProductBusy(false)
    }
  }

  const editProduct = (product: Product) => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setEditingProductId(product.id)
    setProductDraft({
      name: product.name,
      category: product.category,
      sku: product.sku,
      description: product.description,
      stock: product.stock,
      price: product.price,
      badge: product.badge,
      imageUrl: product.imageUrl || '',
      isActive: product.isActive,
    })
    setSelectedImage(null)
    setImagePreview(api.getAssetUrl(product.imageUrl))
    setProductNotice('')
    setView('admin')
  }

  const startNewProduct = () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setEditingProductId('')
    setProductDraft(emptyProductDraft)
    setSelectedImage(null)
    setImagePreview('')
    setProductNotice('')
    setView('admin')
  }

  const handleImageSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProductNotice('Choose a JPEG, PNG, or WebP image.')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setProductNotice('Image must be 5 MB or smaller.')
      event.target.value = ''
      return
    }

    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setProductNotice('')
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearProductImage = () => {
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setSelectedImage(null)
    setImagePreview('')
    setProductDraft((current) => ({ ...current, imageUrl: '' }))
    const input = document.getElementById('product-image-input')
    if (input instanceof HTMLInputElement) input.value = ''
  }

  const deactivateProduct = async (product: Product) => {
    if (!token || !isAdmin) return
    try {
      const saved = product.isActive
        ? await api.deactivateProduct(product.id, token)
        : await api.updateProduct(product.id, { isActive: true }, token)
      setProducts((current) => current.map((item) => item.id === saved.id ? saved : item))
      setProductNotice(product.isActive ? 'Product removed from the storefront.' : 'Product restored to the storefront.')
      if (user) void loadPrivateData(token, user)
    } catch (error) {
      setProductNotice(error instanceof Error ? error.message : 'Could not update product status.')
    }
  }

  const updateOrder = async (order: Order, status: string) => {
    if (!token || !isAdmin) return
    setSavingOrderId(order.id)
    setOrderNotice('')
    try {
      const updated = await api.updateOrderStatus(order.id, status, order.eta, token)
      setOrders((current) => current.map((item) => item.id === updated.id ? updated : item))
      setOrderNotice(`${order.id} updated.`)
    } catch (error) {
      setOrderNotice(error instanceof Error ? error.message : 'Could not update order.')
    } finally {
      setSavingOrderId('')
    }
  }

  const savePolicy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !isAdmin) return
    setPolicyNotice('')
    try {
      const saved = editingPolicyId
        ? await api.updatePolicy(editingPolicyId, policyDraft, token)
        : await api.createPolicy(policyDraft, token)
      setPolicies((current) => editingPolicyId
        ? current.map((policy) => policy.id === saved.id ? saved : policy)
        : [...current, saved].sort((a, b) => a.title.localeCompare(b.title)))
      setPolicyDraft({ title: '', category: 'general', detail: '' })
      setEditingPolicyId('')
      setPolicyNotice(editingPolicyId ? 'Policy changes saved.' : 'Policy published.')
    } catch (error) {
      setPolicyNotice(error instanceof Error ? error.message : 'Could not save policy.')
    }
  }

  const changePolicyStatus = async (policy: Policy) => {
    if (!token || !isAdmin) return
    try {
      const saved = policy.isActive
        ? await api.deactivatePolicy(policy.id, token)
        : await api.updatePolicy(policy.id, { isActive: true }, token)
      setPolicies((current) => current.map((item) => item.id === saved.id ? saved : item))
      setPolicyNotice(policy.isActive ? 'Policy unpublished.' : 'Policy published.')
    } catch (error) {
      setPolicyNotice(error instanceof Error ? error.message : 'Could not update policy.')
    }
  }

  const loadConversation = async (conversation: Conversation) => {
    if (!token) return
    try {
      const result = await api.getConversationMessages(conversation.id, token)
      setActiveConversationId(conversation.id)
      setMessages(result.messages.map((message) => ({
        id: message.id,
        sender: message.sender,
        text: message.text,
      })))
      setView('chat')
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Could not load conversation.')
    }
  }

  const startNewChat = () => {
    setActiveConversationId('')
    setMessages([welcomeMessage])
    setQuestion('')
    setView('chat')
  }

  const loadConversationPage = async (page: number) => {
    if (!token) return
    try {
      const result = await api.getConversations(token, page)
      setConversations(result.items)
      setConversationPage(result.page)
      setConversationPages(result.pages)
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Could not load conversation history.')
    }
  }

  const removeConversation = async (conversation: Conversation) => {
    if (!token) return
    try {
      await api.deleteConversation(conversation.id, token)
      setConversations((current) => current.filter((item) => item.id !== conversation.id))
      if (activeConversationId === conversation.id) startNewChat()
      void loadConversationPage(conversationPage)
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Could not delete conversation.')
    }
  }

  const customerNav: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'chat', label: 'AI assistant', icon: MessageCircle },
    ...(user ? [{ id: 'orders' as const, label: 'My orders', icon: PackageCheck }] : []),
    { id: 'products', label: 'Shop', icon: ShoppingBag },
    ...(user ? [{ id: 'history' as const, label: 'Chat history', icon: ClipboardList }] : []),
    ...(user ? [{ id: 'profile' as const, label: 'My profile', icon: UserRound }] : []),
  ]
  const adminNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: Truck },
    { id: 'policies', label: 'Policies', icon: ShieldCheck },
  ]
  const navigation = isAdmin ? adminNav : customerNav
  const pageTitles: Record<AppView, string> = {
    dashboard: isAdmin ? 'Dashboard' : user ? 'Welcome back' : 'Customer support',
    chat: 'AI support assistant',
    history: 'Chat history',
    products: isAdmin ? 'Product management' : 'Our products',
    orders: isAdmin ? 'Order management' : 'My orders',
    policies: 'Store policies',
    profile: 'My profile',
    admin: 'Product management',
  }
  const pageDescriptions: Record<AppView, string> = {
    dashboard: isAdmin ? 'Here is what is happening across your store.' : 'Your support, shopping, and orders — all in one place.',
    chat: 'Get an answer from our AI-powered support assistant.',
    history: 'Your recent conversations with QueryFlow support.',
    products: isAdmin ? 'Manage catalog details and inventory.' : 'Browse products and find the right fit for you.',
    orders: isAdmin ? 'Review and manage orders across your store.' : 'Track orders placed from your account.',
    policies: 'Helpful information about shopping with us.',
    profile: 'Your account details and access information.',
    admin: 'Manage catalog details and inventory.',
  }
  const goTo = (nextView: AppView) => {
    setView(nextView)
    setMobileMenuOpen(false)
  }

  const renderAdminProducts = () => (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,.95fr)_minmax(0,1.3fr)]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Plus size={19} /></div><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">Inventory management</p><h2 className="mt-1 text-base font-bold text-slate-800">{editingProductId ? `Edit ${editingProductId}` : 'Add a product'}</h2></div></div>
        <form onSubmit={saveProduct} className="space-y-3.5">
          <div>
            <label htmlFor="product-image-input" className="mb-1.5 block text-xs font-medium text-slate-600">Product image <span className="font-normal text-slate-400">(optional)</span></label>
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 sm:flex-row sm:items-center">
              <div className="grid h-28 w-full shrink-0 place-items-center overflow-hidden rounded-lg bg-white sm:w-32">
                {imagePreview
                  ? <img src={imagePreview} alt="Product image preview" className="size-full object-cover" />
                  : <div className="flex flex-col items-center gap-1.5 text-slate-400"><UploadCloud size={23} /><span className="text-[10px]">Image preview</span></div>}
              </div>
              <div className="min-w-0 flex-1">
                <input id="product-image-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelection} className="sr-only" />
                <label htmlFor="product-image-input" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"><UploadCloud size={15} />{selectedImage ? 'Choose another image' : imagePreview ? 'Replace image' : 'Choose image'}</label>
                <p className="mt-2 text-[11px] leading-4 text-slate-500">JPEG, PNG, or WebP · maximum 5 MB</p>
                {selectedImage && <p className="mt-1 truncate text-[11px] font-medium text-slate-600">{selectedImage.name}</p>}
                {imagePreview && <button type="button" onClick={clearProductImage} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700"><Trash2 size={13} />Remove image</button>}
              </div>
            </div>
          </div>
          <label className="block text-xs font-medium text-slate-600">Product name<input required minLength={2} value={productDraft.name} onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          <label className="block text-xs font-medium text-slate-600">SKU<input value={productDraft.sku} onChange={(event) => setProductDraft({ ...productDraft, sku: event.target.value.toUpperCase() })} placeholder="Auto-generated if blank" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          <label className="block text-xs font-medium text-slate-600">Category<input required minLength={2} value={productDraft.category} onChange={(event) => setProductDraft({ ...productDraft, category: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          <label className="block text-xs font-medium text-slate-600">Description<textarea rows={3} value={productDraft.description} onChange={(event) => setProductDraft({ ...productDraft, description: event.target.value })} className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-600">Price<input required type="number" min="0" step=".01" value={productDraft.price} onChange={(event) => setProductDraft({ ...productDraft, price: Number(event.target.value) })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
            <label className="block text-xs font-medium text-slate-600">Stock<input required type="number" min="0" step="1" value={productDraft.stock} onChange={(event) => setProductDraft({ ...productDraft, stock: Number(event.target.value) })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          </div>
          <label className="block text-xs font-medium text-slate-600">Badge<input value={productDraft.badge} onChange={(event) => setProductDraft({ ...productDraft, badge: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          {editingProductId && <label className="flex items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={productDraft.isActive} onChange={(event) => setProductDraft({ ...productDraft, isActive: event.target.checked })} className="size-4 rounded border-slate-300 text-blue-600" />Visible in customer storefront</label>}
          {productNotice &&           <p role="status" className={`rounded-lg px-3 py-2 text-xs ${['saved', 'added', 'removed', 'restored'].some((word) => productNotice.includes(word)) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{productNotice}</p>}
          <div className="flex gap-2"><button type="submit" disabled={productBusy} className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{productBusy ? selectedImage ? 'Uploading & saving…' : 'Saving…' : editingProductId ? 'Save changes' : 'Add product'}</button>{editingProductId && <button type="button" onClick={() => { if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); setEditingProductId(''); setProductDraft(emptyProductDraft); setSelectedImage(null); setImagePreview(''); setProductNotice('') }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>}</div>
        </form>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">Product management</p><h2 className="mt-1 text-base font-bold text-slate-800">Inventory</h2></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{products.length} items</span></div>
        <ProductRows products={products} isAdmin={isAdmin} onEdit={editProduct} onToggleStatus={deactivateProduct} />
      </section>
    </div>
  )

  const renderPolicies = () => (
    <div className="space-y-5">
      {isAdmin && <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">Policy management</p><h2 className="mt-1 text-base font-bold text-slate-800">{editingPolicyId ? 'Edit policy' : 'Add a store policy'}</h2></div>
        <form onSubmit={savePolicy} className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-600">Title<input required minLength={2} maxLength={100} value={policyDraft.title} onChange={(event) => setPolicyDraft({ ...policyDraft, title: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          <label className="block text-xs font-medium text-slate-600">Category<input required minLength={2} maxLength={80} value={policyDraft.category} onChange={(event) => setPolicyDraft({ ...policyDraft, category: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          <label className="block text-xs font-medium text-slate-600 sm:col-span-2">Policy details<textarea required minLength={2} maxLength={3000} rows={3} value={policyDraft.detail} onChange={(event) => setPolicyDraft({ ...policyDraft, detail: event.target.value })} className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
          {policyNotice && <p role="status" className="text-xs text-blue-700 sm:col-span-2">{policyNotice}</p>}
          <div className="flex gap-2 sm:col-span-2"><button type="submit" className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700">{editingPolicyId ? 'Save policy' : 'Publish policy'}</button>{editingPolicyId && <button type="button" onClick={() => { setEditingPolicyId(''); setPolicyDraft({ title: '', category: 'general', detail: '' }) }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>}</div>
        </form>
      </section>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {policies.map((policy, index) => (
          <article key={policy.id} className={`rounded-xl border bg-white p-5 shadow-sm ${policy.isActive ? 'border-slate-200' : 'border-amber-200 opacity-75'}`}>
            <div className={`mb-4 grid size-11 place-items-center rounded-xl ${['bg-blue-50 text-blue-600', 'bg-emerald-50 text-emerald-600', 'bg-violet-50 text-violet-600'][index % 3]}`}><ShieldCheck size={20} /></div>
            <div className="flex items-start justify-between gap-2"><h2 className="text-base font-bold text-slate-800">{policy.title}</h2>{isAdmin && <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${policy.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{policy.isActive ? 'Published' : 'Unpublished'}</span>}</div>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{policy.category}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{policy.detail}</p>
            {isAdmin && <div className="mt-4 flex gap-2"><button type="button" onClick={() => { setEditingPolicyId(policy.id); setPolicyDraft({ title: policy.title, category: policy.category, detail: policy.detail }); setPolicyNotice('') }} className="rounded-lg border border-blue-200 px-3 py-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-50">Edit</button><button type="button" onClick={() => void changePolicyStatus(policy)} className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">{policy.isActive ? 'Unpublish' : 'Publish'}</button></div>}
          </article>
        ))}
        {!policies.length && <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No active policies are available.</div>}
      </div>
    </div>
  )

  const renderProfile = () => user ? (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4"><div className="grid size-16 place-items-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">{user.name.slice(0, 1)}</div><div><h2 className="text-lg font-bold text-slate-800">Personal information</h2><p className="mt-1 text-xs text-slate-500">Your account is managed securely.</p></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs text-slate-500">Full name</p><p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">{user.name}</p></div>
          <div><p className="text-xs text-slate-500">Email address</p><p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">{user.email}</p></div>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">Account access</p><h2 className="mt-1 text-base font-bold text-slate-800">Your role</h2><div className="mt-4 flex items-center gap-3 rounded-lg bg-blue-50 p-3 text-blue-700"><ShieldCheck size={20} /><span className="text-sm font-semibold">{isAdmin ? 'Administrator' : 'Customer'}</span></div><p className="mt-3 text-xs leading-5 text-slate-500">Your account role determines which pages and data you can access.</p></section>
    </div>
  ) : <section className="rounded-xl border border-slate-200 bg-white p-8 text-center"><h2 className="font-bold text-slate-800">Sign in to view your profile</h2><p className="mt-2 text-sm text-slate-500">Your account details are private.</p><button type="button" onClick={() => setView('dashboard')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Go to sign in</button></section>

  const renderHistory = () => (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">Saved conversations</p><h2 className="mt-1 text-base font-bold text-slate-800">Your chat history</h2></div><button type="button" onClick={startNewChat} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Plus size={14} />New chat</button></div>
      {conversations.length ? <div className="divide-y divide-slate-100">{conversations.map((conversation) => <div key={conversation.id} className="flex items-center gap-2 py-3"><button type="button" onClick={() => void loadConversation(conversation)} className="flex min-w-0 flex-1 items-center gap-3 text-left hover:bg-slate-50"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><MessageCircle size={17} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{conversation.title}</p><p className="mt-1 text-[11px] text-slate-500">{new Date(conversation.lastMessageAt).toLocaleString()}</p></div><ChevronRight size={16} className="text-slate-400" /></button><button type="button" onClick={() => void removeConversation(conversation)} aria-label={`Delete conversation ${conversation.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div>)}</div> : <div className="py-10 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-blue-50 text-blue-600"><MessageCircle size={20} /></div><h3 className="mt-3 text-sm font-semibold text-slate-800">No saved conversations yet</h3><p className="mt-1 text-xs text-slate-500">Your conversations will appear here after you ask a question.</p></div>}
      {conversationPages > 1 && <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><button type="button" disabled={conversationPage <= 1} onClick={() => void loadConversationPage(conversationPage - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40">Previous</button><span className="text-xs text-slate-500">Page {conversationPage} of {conversationPages}</span><button type="button" disabled={conversationPage >= conversationPages} onClick={() => void loadConversationPage(conversationPage + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40">Next</button></div>}
    </section>
  )

  const chatPanel = (
    <ChatPanel
      apiStatus={apiStatus}
      userName={user?.name}
      messages={messages}
      busy={chatBusy}
      question={question}
      onQuestionChange={setQuestion}
      onSubmit={handleChat}
      onNewChat={user ? startNewChat : undefined}
    />
  )

  const authPanel = (
    <AuthPanel
      user={user}
      authMode={authMode}
      name={name}
      email={email}
      password={password}
      error={authError}
      loading={authLoading}
      variant={user ? 'default' : 'landing'}
      onModeChange={(mode) => {
        setAuthMode(mode)
        setAuthError('')
      }}
      onNameChange={setName}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleAuth}
    />
  )

  const currentPage = view === 'dashboard'
    ? isAdmin
      ? <AdminDashboardPage
        dashboard={adminDashboard}
        products={products}
        lowStockProducts={lowStockProducts}
        inStockCount={inStockCount}
        orders={orders}
        savingOrderId={savingOrderId}
        onViewOrders={() => setView('orders')}
        onAddProduct={startNewProduct}
        onUpdateOrder={(order, status) => void updateOrder(order, status)}
        onEditProduct={editProduct}
        onToggleProductStatus={deactivateProduct}
      />
      : <CustomerDashboard
        user={user}
        productCount={products.length}
        inStockCount={inStockCount}
        orders={orders}
        policies={policies}
        chatPanel={chatPanel}
        authPanel={authPanel}
        onViewOrders={() => setView('orders')}
        onViewPolicies={() => setView('policies')}
      />
    : view === 'chat'
      ? <ChatPanel
        apiStatus={apiStatus}
        userName={user?.name}
        messages={messages}
        busy={chatBusy}
        question={question}
        onQuestionChange={setQuestion}
        onSubmit={handleChat}
        onNewChat={user ? startNewChat : undefined}
      />
      : view === 'products'
        ? <ProductCatalog products={filteredProducts} search={search} loading={loading} isAdmin={isAdmin} onSearchChange={setSearch} onEdit={editProduct} />
        : view === 'orders'
          ? user ? <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">{isAdmin ? 'Store-wide access' : 'Private to your account'}</p><h2 className="mt-1 text-lg font-bold text-slate-800">{isAdmin ? 'All customer orders' : 'Your order history'}</h2></div><button type="button" onClick={() => void loadPrivateData(token, user)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Refresh orders</button></div>{orderNotice && <p role="status" className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">{orderNotice}</p>}<OrderList rows={orders} isAdmin={isAdmin} showCustomer={isAdmin} onUpdate={(order, status) => void updateOrder(order, status)} savingOrderId={savingOrderId} /></section>
            : <section className="rounded-xl border border-slate-200 bg-white p-8 text-center"><h2 className="font-bold text-slate-800">Sign in to view orders</h2><p className="mt-2 text-sm text-slate-500">Order details are private to the account owner.</p><button type="button" onClick={() => setView('dashboard')} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Go to sign in</button></section>
          : view === 'policies'
            ? renderPolicies()
            : view === 'profile'
              ? renderProfile()
              : view === 'history'
                ? renderHistory()
                : isAdmin
                  ? renderAdminProducts()
                  : <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Administrator access is required for this page.</div>

  if (!user && token) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6f7fb] px-4 text-center">
        <div>
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#163968] text-lg font-extrabold text-white">Q</div>
          <p className="mt-4 text-sm font-semibold text-slate-700">Restoring your secure session…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <LandingPage
        authPanel={authPanel}
        apiStatus={apiStatus}
        error={appError}
        onRetry={() => void loadPublicData()}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f8ff] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-slate-200/80 shadow-xl shadow-slate-900/5 lg:block">
        <AppSidebar navigation={navigation} view={view} isAdmin={isAdmin} user={user} onNavigate={goTo} onLogout={handleLogout} />
      </aside>
      {mobileMenuOpen && <div className="fixed inset-0 z-40 lg:hidden"><button type="button" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-slate-950/40" /><aside className="absolute inset-y-0 left-0 w-[270px] shadow-2xl"><AppSidebar navigation={navigation} view={view} isAdmin={isAdmin} user={user} onNavigate={goTo} onLogout={handleLogout} /></aside></div>}
      <div className="min-h-screen lg:ml-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Open navigation menu" onClick={() => setMobileMenuOpen(true)} className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"><Menu size={19} /></button>
            <div className="min-w-0"><p className="hidden text-[10px] text-slate-400 sm:block">QueryFlow <span className="mx-1">/</span> {isAdmin ? 'Admin' : 'Customer'}</p><h1 className="truncate text-sm font-bold text-slate-800 sm:mt-0.5">{pageTitles[view]}</h1></div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${apiStatus === 'connected' ? 'bg-emerald-50 text-emerald-700' : apiStatus === 'offline' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}><span className={`size-1.5 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : apiStatus === 'offline' ? 'bg-red-500' : 'bg-amber-500'}`} />{apiStatus === 'connected' ? 'Connected' : apiStatus === 'offline' ? 'Offline' : 'Connecting'}</span>
            {user ? <button type="button" onClick={() => setView('profile')} className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-slate-50"><span className={`grid size-8 place-items-center rounded-full text-xs font-bold text-white ${isAdmin ? 'bg-violet-500' : 'bg-blue-600'}`}>{user.name.slice(0, 1)}</span><span className="hidden text-left sm:block"><span className="block text-xs font-semibold text-slate-700">{user.name}</span><span className="block text-[10px] text-slate-400">{isAdmin ? 'Administrator' : 'Customer'}</span></span><ChevronDown size={14} className="hidden text-slate-400 sm:block" /></button> : <button type="button" onClick={() => setView('dashboard')} className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700">Sign in</button>}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-7 sm:py-7">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">{isAdmin ? 'Admin workspace' : user ? 'Customer portal' : 'Welcome to QueryFlow'}</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{pageTitles[view]}</h2><p className="mt-1 text-xs text-slate-500 sm:text-sm">{pageDescriptions[view]}</p></div>
            {user && <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600"><UserRound size={13} />{user.name}<span className="text-slate-300">·</span>{role === 'admin' ? 'Admin' : 'Customer'}</span>}
          </div>
          {appError && <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{appError}</span><button type="button" onClick={() => void loadPublicData()} className="font-semibold underline">Retry</button></div>}
          {currentPage}
          <footer className="mt-7 flex flex-col gap-1 border-t border-slate-200 pt-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>© QueryFlow AI · Customer support workspace</span><span className="inline-flex items-center gap-1"><ShieldCheck size={12} />Secure role-based access</span></footer>
        </main>
      </div>
    </div>
  )
}

export default App
