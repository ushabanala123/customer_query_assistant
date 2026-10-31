import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  label: string
  value: string | number
  note: string
  icon: LucideIcon
  color: string
}

export function StatCard({ label, value, note, icon: Icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">{value}</p>
        </div>
        <div className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon size={19} /></div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{note}</p>
    </div>
  )
}
