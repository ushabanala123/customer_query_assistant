import { Settings, ShoppingBag, Trash2 } from 'lucide-react'
import type { Product } from '../api'
import { api } from '../api'

type ProductRowsProps = {
  products: Product[]
  isAdmin: boolean
  allowEdit?: boolean
  onEdit: (product: Product) => void
  onToggleStatus: (product: Product) => void
}

export function ProductRows({ products, isAdmin, allowEdit = true, onEdit, onToggleStatus }: ProductRowsProps) {
  if (!products.length) return <p className="py-6 text-center text-sm text-slate-500">No products currently need attention.</p>

  return (
    <div className="divide-y divide-slate-100">
      {products.map((product) => (
        <div key={product.id} className="flex items-center gap-3 py-3">
          {product.imageUrl
            ? <img src={api.getAssetUrl(product.imageUrl)} alt="" className="size-10 shrink-0 rounded-xl border border-slate-100 object-cover" />
            : <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><ShoppingBag size={18} /></div>}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{product.name}</p><p className="mt-0.5 text-xs text-slate-500">{product.category} · {product.sku}</p></div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${!product.isActive ? 'bg-slate-100 text-slate-600' : product.stock <= 12 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{product.isActive ? `${product.stock} in stock` : 'Archived'}</span>
          {isAdmin && allowEdit && <button type="button" onClick={() => onEdit(product)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600" aria-label={`Edit ${product.name}`}><Settings size={16} /></button>}
          {isAdmin && allowEdit && <button type="button" onClick={() => void onToggleStatus(product)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={product.isActive ? `Deactivate ${product.name}` : `Reactivate ${product.name}`}><Trash2 size={16} /></button>}
        </div>
      ))}
    </div>
  )
}
