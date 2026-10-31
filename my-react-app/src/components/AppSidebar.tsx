import { ChevronRight, Headphones, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { User } from '../api'

export type AppView = 'dashboard' | 'chat' | 'history' | 'products' | 'orders' | 'policies' | 'profile' | 'admin'
export type NavItem = { id: AppView; label: string; icon: LucideIcon }

type AppSidebarProps = {
  navigation: NavItem[]
  view: AppView
  isAdmin: boolean
  user: User | null
  onNavigate: (view: AppView) => void
  onLogout: () => void
}

export function AppSidebar({ navigation, view, isAdmin, user, onNavigate, onLogout }: AppSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-[#0f2341] text-white">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-lg font-extrabold shadow-lg shadow-blue-950/30">Q</div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.18em] text-blue-300">QueryFlow</div>
          <div className="text-sm font-semibold">Support portal</div>
        </div>
      </div>
      <div className="mx-4 mb-2 border-t border-white/10" />
      <div className="px-5 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">
        {isAdmin ? 'Administration' : 'Customer space'}
      </div>
      <nav className="space-y-1 px-3">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => onNavigate(id)}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
              view === id
                ? 'bg-blue-600 font-semibold text-white shadow-md shadow-blue-950/20'
                : 'text-slate-300 hover:bg-slate-700/70 hover:text-white'
            }`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span className="flex-1">{label}</span>
            {view === id && <ChevronRight size={16} className="opacity-70" />}
          </button>
        ))}
      </nav>
      <div className="mt-auto p-3">
        <div className="rounded-xl border border-white/10 bg-white/[.045] p-3">
          <div className="flex items-start gap-2.5">
            <Headphones size={18} className="mt-0.5 text-blue-300" />
            <div>
              <p className="text-xs font-semibold text-slate-100">Need a hand?</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">Our support team is here to help.</p>
            </div>
          </div>
        </div>
        {user && (
          <button type="button" onClick={onLogout} className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white">
            <LogOut size={18} />
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}
