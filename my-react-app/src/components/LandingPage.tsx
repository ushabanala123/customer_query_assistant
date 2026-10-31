import type { ReactNode } from 'react'
import {
  ArrowUpRight,
  Bot,
  CircleCheck,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

type LandingPageProps = {
  authPanel: ReactNode
  apiStatus: 'connecting' | 'connected' | 'offline'
  error: string
  onRetry: () => void
}

const features = [
  {
    icon: Bot,
    title: 'Answers, without the wait',
    description: 'Ask the AI assistant about products, orders, returns, and store policies.',
  },
  {
    icon: PackageCheck,
    title: 'Your orders, in one place',
    description: 'Sign in to see your order history and get support tailored to your account.',
  },
  {
    icon: ShieldCheck,
    title: 'A smarter support workspace',
    description: 'Store teams can manage products, orders, and helpful customer policies.',
  },
]

export function LandingPage({ authPanel, apiStatus, error, onRetry }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-5 text-slate-900 sm:px-7 sm:py-7">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <a href="/" className="flex items-center gap-3" aria-label="AI-Powered Customer Query Assistant home">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#163968] text-lg font-extrabold text-white shadow-lg shadow-blue-950/15">A</span>
          <span>
            <span className="block text-xs font-extrabold tracking-tight text-[#132b4b] sm:text-sm">AI-Powered Customer Query Assistant</span>
            <span className="block text-[11px] font-medium text-slate-500">Customer support, made simple</span>
          </span>
        </a>
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 sm:flex">
          <span className={`size-2 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : apiStatus === 'offline' ? 'bg-red-500' : 'animate-pulse bg-amber-400'}`} />
          {apiStatus === 'connected' ? 'Service online' : apiStatus === 'offline' ? 'Service unavailable' : 'Connecting'}
        </div>
      </header>

      <main className="mx-auto mt-6 grid w-full max-w-7xl items-stretch gap-5 lg:mt-8 lg:min-h-[min(760px,calc(100vh-132px))] lg:grid-cols-[1.05fr_.95fr]">
        <section id="project-overview" className="relative flex min-h-[620px] flex-col overflow-hidden rounded-[30px] bg-[#102746] px-6 py-8 text-white shadow-2xl shadow-blue-950/10 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="pointer-events-none absolute -right-36 -top-32 size-[420px] rounded-full border border-white/[.07]" />
          <div className="pointer-events-none absolute -right-16 -top-12 size-[280px] rounded-full border border-white/[.07]" />
          <div className="pointer-events-none absolute -bottom-48 -left-36 size-[420px] rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-white/[.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-cyan-100">
              <Sparkles size={13} />
              The customer care hub
            </div>
            <h1 className="mt-7 max-w-xl text-[2.55rem] font-semibold leading-[1.1] tracking-[-.045em] sm:text-5xl">
              Better answers.
              <span className="block text-cyan-300">Happier customers.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-blue-100/75 sm:text-base sm:leading-7">
              Get AI-powered support, order updates, and store information together in one simple place.
            </p>
          </div>

          <div className="relative mt-8 space-y-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.07] text-cyan-200">
                  <Icon size={17} strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-white">{title}</h2>
                  <p className="mt-1 max-w-md text-xs leading-5 text-blue-100/65 sm:text-[13px]">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-auto pt-9">
            <div className="rounded-2xl border border-white/10 bg-white/[.07] p-4 backdrop-blur-sm sm:p-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-100/70">
                <MessageCircle size={14} className="text-cyan-300" />
                A little help goes a long way
              </div>
              <div className="mt-3 flex items-start gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-cyan-300/15 text-cyan-200">
                  <Bot size={15} />
                </span>
                <p className="rounded-xl rounded-tl-sm bg-white/10 px-3 py-2.5 text-xs leading-5 text-blue-50">
                  Ask about an order, find a product, or get a quick answer about store policies.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-[10px] font-medium text-blue-100/65">
                <span className="inline-flex items-center gap-1.5"><CircleCheck size={12} className="text-emerald-300" />Product help</span>
                <span className="inline-flex items-center gap-1.5"><CircleCheck size={12} className="text-emerald-300" />Order support</span>
                <span className="inline-flex items-center gap-1.5"><CircleCheck size={12} className="text-emerald-300" />Store policies</span>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-blue-100/45">One connected experience for customers and store teams.</p>
          </div>
        </section>

        <section className="flex flex-col justify-center px-1 py-5 sm:px-5 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between sm:hidden">
                <span className="text-xs font-semibold text-slate-500">Customer portal</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                  <span className={`size-1.5 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : apiStatus === 'offline' ? 'bg-red-500' : 'animate-pulse bg-amber-400'}`} />
                  {apiStatus === 'connected' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Connecting'}
                </span>
              </div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Welcome to your support workspace</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#142b49] sm:text-[28px]">Your support starts here.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to continue, or create an account to get started.</p>
            </div>

            {error && (
              <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                <span>{error}</span>
                <button type="button" onClick={onRetry} className="shrink-0 font-semibold underline underline-offset-2">Retry</button>
              </div>
            )}

            {authPanel}

            <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">
              <ShieldCheck size={14} className="text-emerald-600" />
              Your account is protected with secure, role-based access.
            </p>
            <a href="#project-overview" className="mt-5 inline-flex w-full items-center justify-center gap-1 text-xs font-semibold text-blue-700 transition hover:text-blue-900">
              Discover what this assistant can do <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
