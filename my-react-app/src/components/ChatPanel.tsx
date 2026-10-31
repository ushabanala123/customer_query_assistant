import type { ChangeEvent, FormEvent } from 'react'
import { Bot, Plus, Send, Sparkles } from 'lucide-react'

export type ChatMessageView = { id: number | string; sender: 'user' | 'assistant'; text: string }

type ChatPanelProps = {
  apiStatus: 'connecting' | 'connected' | 'offline'
  userName?: string
  messages: ChatMessageView[]
  busy: boolean
  question: string
  onQuestionChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onNewChat?: () => void
}

export function ChatPanel({
  apiStatus,
  userName,
  messages,
  busy,
  question,
  onQuestionChange,
  onSubmit,
  onNewChat,
}: ChatPanelProps) {
  return (
    <section className="flex min-h-[530px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Bot size={20} /></div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">QueryFlow AI Assistant</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className={`size-1.5 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : apiStatus === 'offline' ? 'bg-red-500' : 'bg-amber-500'}`} />
              {apiStatus === 'connected' ? 'Online · store information connected' : apiStatus === 'offline' ? 'API unavailable' : 'Connecting'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 sm:inline">
            {userName ? 'Private conversation' : 'Guest support'}
          </span>
          {userName && onNewChat && <button type="button" onClick={onNewChat} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"><Plus size={13} />New chat</button>}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-[#fbfdff] p-4 sm:p-6" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-end gap-2.5 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.sender === 'assistant' && <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-blue-100 bg-white text-blue-600"><Sparkles size={16} /></div>}
            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
              message.sender === 'user'
                ? 'rounded-br-sm bg-blue-600 text-white'
                : 'rounded-bl-sm border border-slate-100 bg-white text-slate-700'
            }`}>{message.text}</div>
            {message.sender === 'user' && <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-200 text-[11px] font-bold text-slate-600">{userName?.slice(0, 1) || 'Y'}</div>}
          </div>
        ))}
        {busy && <div className="flex items-center gap-2.5"><div className="grid size-8 place-items-center rounded-lg border border-blue-100 bg-white text-blue-600"><Sparkles size={16} /></div><div className="rounded-2xl rounded-bl-sm border border-slate-100 bg-white px-4 py-3 text-sm text-slate-400">Thinking…</div></div>}
      </div>
      {!userName && <div className="mx-4 mb-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">Sign in to ask about private order details.</div>}
      <form onSubmit={onSubmit} className="border-t border-slate-100 bg-white p-3 sm:p-4">
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onQuestionChange(event.target.value)}
            placeholder="Type your question..."
            aria-label="Ask the support assistant"
            disabled={busy}
            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
          />
          <button type="submit" disabled={busy || !question.trim()} aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Send size={17} /></button>
        </div>
        <p className="mt-2 px-1 text-[10px] text-slate-400">Please verify important order details with your confirmation email.</p>
      </form>
    </section>
  )
}
