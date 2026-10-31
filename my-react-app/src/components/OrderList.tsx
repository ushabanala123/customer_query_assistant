import type { Order } from '../api'
import { PackageCheck } from 'lucide-react'

type OrderListProps = {
  rows: Order[]
  isAdmin: boolean
  showCustomer?: boolean
  savingOrderId?: string
  onUpdate?: (order: Order, status: string) => void
}

export function OrderList({ rows, isAdmin, showCustomer = false, savingOrderId = '', onUpdate }: OrderListProps) {
  if (!rows.length) return <p className="py-8 text-center text-sm text-slate-500">No orders to show.</p>

  return (
    <div className="divide-y divide-slate-100">
      {rows.map((order) => (
        <div key={order.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><PackageCheck size={18} /></div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-600">{order.id}</p>
              <p className="truncate text-sm font-semibold text-slate-800">{order.item}</p>
              {showCustomer && <p className="mt-0.5 text-xs text-slate-500">{order.customer}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 pl-[52px] sm:pl-0">
            {isAdmin ? (
              <>
                <label className="sr-only" htmlFor={`order-status-${order.id}`}>Update status for {order.id}</label>
                <select
                  id={`order-status-${order.id}`}
                  value={order.status}
                  disabled={savingOrderId === order.id}
                  onChange={(event) => onUpdate?.(order, event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-60"
                >
                  {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}
                </select>
              </>
            ) : (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                order.status.toLowerCase() === 'delivered'
                  ? 'bg-emerald-50 text-emerald-700'
                  : order.status.toLowerCase() === 'processing'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-blue-50 text-blue-700'
              }`}>{order.status}</span>
            )}
            <span className="min-w-24 text-xs text-slate-500">{order.eta}</span>
            <span className="text-sm font-semibold text-slate-800">{order.total}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
