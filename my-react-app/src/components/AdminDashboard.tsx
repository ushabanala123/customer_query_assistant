import { Activity, ArrowRight, CheckCircle2, ClipboardList, MessageCircle, Package, Plus } from 'lucide-react'
import type { AdminDashboard as AdminDashboardData, Order, Product } from '../api'
import { OrderList } from './OrderList'
import { ProductRows } from './ProductRows'
import { StatCard } from './StatCard'

type AdminDashboardProps = {
  dashboard: AdminDashboardData | null
  products: Product[]
  lowStockProducts: Product[]
  inStockCount: number
  orders: Order[]
  savingOrderId: string
  onViewOrders: () => void
  onAddProduct: () => void
  onUpdateOrder: (order: Order, status: string) => void
  onEditProduct: (product: Product) => void
  onToggleProductStatus: (product: Product) => void
}

export function AdminDashboard({
  dashboard,
  products,
  lowStockProducts,
  inStockCount,
  orders,
  savingOrderId,
  onViewOrders,
  onAddProduct,
  onUpdateOrder,
  onEditProduct,
  onToggleProductStatus,
}: AdminDashboardProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total products" value={dashboard?.activeProducts ?? products.filter((product) => product.isActive).length} note="Active catalog items" icon={Package} color="bg-blue-50 text-blue-600" />
        <StatCard label="Low stock" value={dashboard?.lowStockProducts ?? lowStockProducts.length} note="Restock attention needed" icon={Activity} color="bg-amber-50 text-amber-600" />
        <StatCard label="Total orders" value={dashboard?.totalOrders ?? orders.length} note="Across all customers" icon={ClipboardList} color="bg-violet-50 text-violet-600" />
        <StatCard label="In stock" value={inStockCount} note="Available for customers" icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Conversations" value={dashboard?.totalConversations ?? 0} note="Saved support chats" icon={MessageCircle} color="bg-cyan-50 text-cyan-700" />
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">Store operations</p><h2 className="mt-1 text-lg font-bold text-slate-800">Recent orders</h2></div><button type="button" onClick={onViewOrders} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">View all<ArrowRight size={14} /></button></div>
        <OrderList rows={orders.slice(0, 5)} isAdmin showCustomer onUpdate={onUpdateOrder} savingOrderId={savingOrderId} />
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">Inventory</p><h2 className="mt-1 text-lg font-bold text-slate-800">Products to watch</h2></div><button type="button" onClick={onAddProduct} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><Plus size={15} />Add product</button></div>
        <ProductRows products={lowStockProducts} isAdmin onEdit={onEditProduct} onToggleStatus={onToggleProductStatus} />
      </section>
    </div>
  )
}
