'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/supabase/client'
import { slugify, tradeCategoryLabel } from '@/lib/utils'
import type { TradeCategory } from '@/types'

const TRADE_CATEGORIES: TradeCategory[] = [
  'hospitality', 'food_service', 'delivery', 'cleaning',
  'retail', 'childcare', 'healthcare_support', 'beauty_wellness',
  'transportation', 'maintenance', 'security', 'other',
]

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [tradeCategory, setTradeCategory] = useState<TradeCategory | ''>('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!tradeCategory) {
      toast.error('Please select your trade category')
      return
    }
    setLoading(true)

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user returned')

      // 2. Create worker profile via API
      const slug = slugify(displayName) + '-' + Math.random().toString(36).slice(2, 7)

      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          slug,
          trade_category: tradeCategory,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create profile')
      }

      toast.success('Account created! Welcome to TipTop 🎉')
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span style={{ fontFamily: 'var(--font-display)' }} className="text-4xl text-brand-400 hover:text-brand-300 transition-colors">
              TipTop
            </span>
          </Link>
          <p className="text-ink-500 mt-2 text-sm">Create your free profile</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-brand-500' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSignup} className="space-y-5">

            {step === 1 && (
              <>
                <h2 className="text-white font-semibold text-lg mb-4">Your account</h2>
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-ink-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-ink-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      placeholder="8+ characters"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-semibold transition-all active:scale-95">
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-white font-semibold text-lg mb-4">Your profile</h2>

                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1.5">Your name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-ink-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    placeholder="Alex Johnson"
                    required
                    minLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-2">Your trade</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TRADE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTradeCategory(cat)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all border ${
                          tradeCategory === cat
                            ? 'bg-brand-600/20 border-brand-500 text-brand-300'
                            : 'bg-white/5 border-white/10 text-ink-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {tradeCategoryLabel(cat)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-ink-400 py-3 rounded-xl font-semibold transition-all border border-white/10"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !displayName || !tradeCategory}
                    className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:pointer-events-none text-white py-3 rounded-xl font-semibold transition-all active:scale-95"
                  >
                    {loading ? 'Creating...' : 'Create profile'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-ink-500 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
