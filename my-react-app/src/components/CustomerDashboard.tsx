import type { ReactNode } from 'react'
import { CircleHelp, PackageCheck, ShoppingBag } from 'lucide-react'
import type { Order, Policy, User } from '../api'
import { OrderList } from './OrderList'
import { StatCard } from './StatCard'

type CustomerDashboardProps = {
  user: User | null
  productCount: number
  inStockCount: number
  orders: Order[]
  policies: Policy[]
  chatPanel: ReactNode
  authPanel: ReactNode
  onViewOrders: () => void
  onViewPolicies: () => void
}

export function CustomerDashboard({
  user,
  productCount,
  inStockCount,
  orders,
  policies,
  chatPanel,
  authPanel,
  onViewOrders,
  onViewPolicies,
}: CustomerDashboardProps) {
  return (
    <div className="space-y-5">
      {!user && <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><CircleHelp size={18} className="mt-0.5 shrink-0" /><p>Sign in or create an account to see your orders and get personalized support.</p></div>}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Products" value={productCount} note={`${inStockCount} currently available`} icon={ShoppingBag} color="bg-blue-50 text-blue-600" />
        <StatCard label="Your orders" value={user ? orders.length : '—'} note={user ? 'Private to your account' : 'Sign in to view'} icon={PackageCheck} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Help topics" value={policies.length} note="Policies and quick answers" icon={CircleHelp} color="bg-violet-50 text-violet-600" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,.85fr)]">
        {chatPanel}
        <div className="space-y-5">
          {authPanel}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">Orders</p><h2 className="mt-1 text-base font-bold text-slate-800">Recent activity</h2></div>{user && <button type="button" onClick={onViewOrders} className="text-xs font-semibold text-blue-600 hover:text-blue-800">View all</button>}</div>
            {user ? <OrderList rows={orders.slice(0, 2)} isAdmin={false} /> : <p className="py-3 text-xs text-slate-500">Sign in to view your order activity.</p>}
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">Help center</p><h2 className="mt-1 text-base font-bold text-slate-800">Quick policies</h2></div><button type="button" onClick={onViewPolicies} className="text-xs font-semibold text-blue-600 hover:text-blue-800">View all</button></div>
            <div className="divide-y divide-slate-100">{policies.slice(0, 3).map((policy) => <div key={policy.title} className="py-2.5"><p className="text-xs font-semibold text-slate-700">{policy.title}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{policy.detail}</p></div>)}</div>
          </section>
        </div>
      </div>
    </div>
  )
}
