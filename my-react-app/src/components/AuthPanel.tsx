import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { User } from '../api'

type AuthPanelProps = {
  user: User | null
  authMode: 'login' | 'register'
  name: string
  email: string
  password: string
  error: string
  loading: boolean
  variant?: 'default' | 'landing'
  onModeChange: (mode: 'login' | 'register') => void
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthPanel({
  user,
  authMode,
  name,
  email,
  password,
  error,
  loading,
  variant = 'default',
  onModeChange,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AuthPanelProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const isLanding = variant === 'landing'
  const inputClassName = `mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 ${isLanding ? 'py-3' : 'py-2.5'} text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100`
  const passwordInputClassName = `${inputClassName} pr-11`

  return (
    <section className={isLanding
      ? 'rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-32px_rgba(15,35,65,.24)] sm:p-7'
      : 'rounded-xl border border-slate-200 bg-white p-5 shadow-sm'}>
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-600">{user ? 'Account' : 'Secure access'}</p>
        <h2 className={`mt-1 font-bold text-slate-800 ${isLanding ? 'text-xl' : 'text-lg'}`}>
          {user ? 'Your account' : authMode === 'login' ? 'Welcome back!' : 'Create your account'}
        </h2>
      </div>
      {user ? (
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <div className="grid size-11 place-items-center rounded-full bg-blue-100 font-bold text-blue-700">{user.name.slice(0, 1)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{user.role === 'admin' ? 'Admin' : 'Customer'}</span>
        </div>
      ) : (
        <form onSubmit={onSubmit} className={isLanding ? 'space-y-4' : 'space-y-3'}>
          <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onModeChange('login')}
              className={`rounded-lg py-2.5 text-xs font-semibold transition ${authMode === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => onModeChange('register')}
              className={`rounded-lg py-2.5 text-xs font-semibold transition ${authMode === 'register' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Create account
            </button>
          </div>
          {authMode === 'register' && (
            <label className="block text-xs font-semibold text-slate-600">
              Full name
              <input
                required
                minLength={2}
                autoComplete="name"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Jordan Lee"
                className={inputClassName}
              />
            </label>
          )}
          <label className="block text-xs font-semibold text-slate-600">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="you@example.com"
              className={inputClassName}
            />
          </label>
          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-600">Password</label>
            <div className="relative">
              <input
                id="auth-password"
                required
                type={passwordVisible ? 'text' : 'password'}
                minLength={authMode === 'login' ? 1 : 8}
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder={authMode === 'login' ? 'Enter your password' : 'At least 8 characters'}
                className={passwordInputClassName}
              />
              <button
                type="button"
                aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible((visible) => !visible)}
                className="absolute inset-y-0 right-2 grid w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Please wait…' : authMode === 'login' ? 'Sign in securely' : 'Create your account'}
          </button>
          <p className="text-center text-[10px] leading-4 text-slate-400">Your role and page access are assigned securely by the server.</p>
        </form>
      )}
    </section>
  )
}
