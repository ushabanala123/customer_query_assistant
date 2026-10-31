import { Search, ShoppingBag } from 'lucide-react'
import type { Product } from '../api'
import { api } from '../api'

type ProductCatalogProps = {
  products: Product[]
  search: string
  loading: boolean
  isAdmin: boolean
  onSearchChange: (value: string) => void
  onEdit: (product: Product) => void
}

export function ProductCatalog({
  products,
  search,
  loading,
  isAdmin,
  onSearchChange,
  onEdit,
}: ProductCatalogProps) {
  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs text-slate-500">{isAdmin ? 'Inventory catalog' : 'Browse our storefront'}</p><p className="mt-1 text-sm font-semibold text-slate-800">{products.length} products</p></div>
        <label className="relative block w-full sm:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search products or category" className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100" /></label>
      </section>
      {loading ? <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading products…</div> : products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product, index) => (
            <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className={`relative grid h-36 place-items-center overflow-hidden ${['bg-blue-50', 'bg-violet-50', 'bg-sky-50', 'bg-emerald-50'][index % 4]}`}>
                {product.imageUrl
                  ? <img src={api.getAssetUrl(product.imageUrl)} alt={product.name} className="size-full object-cover" loading="lazy" />
                  : <div className="grid size-16 place-items-center rounded-2xl bg-white text-blue-600 shadow-sm"><ShoppingBag size={30} strokeWidth={1.5} /></div>}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between"><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${product.stock <= 12 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{product.badge}</span><span className="text-[10px] text-slate-400">{product.sku}</span></div>
                <div><h3 className="text-sm font-bold text-slate-800">{product.name}</h3><p className="mt-1 text-xs text-slate-500">{product.category}</p>{product.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{product.description}</p>}</div>
                <div className="flex items-center justify-between"><span className="text-base font-bold text-slate-800">${product.price.toFixed(2)}</span><span className="text-[11px] text-slate-500">{product.stock} in stock</span></div>
                {isAdmin && <button type="button" onClick={() => onEdit(product)} className="w-full rounded-lg border border-blue-200 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">Edit product</button>}
              </div>
            </article>
          ))}
        </div>
      ) : <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">No products match your search.</div>}
    </div>
  )
}
