export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'
import { formatRating, timeAgo } from '@/lib/utils'
import { Star, TrendingUp, MessageSquare } from 'lucide-react'

export default async function ReviewsDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: worker } = await supabase
    .from('workers')
    .select('id, overall_rating, review_count')
    .eq('auth_user_id', user.id)
    .single()

  if (!worker) redirect('/signup')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('worker_id', worker.id)
    .order('created_at', { ascending: false })

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews?.forEach(r => { breakdown[r.rating as keyof typeof breakdown]++ })

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl text-white">Reviews</h1>
        <p className="text-ink-500 mt-1">All your verified customer reviews</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
          <div style={{ fontFamily: 'var(--font-display)' }} className="text-4xl text-gold-500">
            {worker.review_count > 0 ? formatRating(worker.overall_rating) : '—'}
          </div>
          <div className="flex justify-center gap-0.5 mt-2 mb-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(worker.overall_rating) ? 'text-gold-500 fill-current' : 'text-ink-600'}`} />
            ))}
          </div>
          <div className="text-xs text-ink-500">Overall rating</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
          <div style={{ fontFamily: 'var(--font-display)' }} className="text-4xl text-brand-400">
            {worker.review_count}
          </div>
          <TrendingUp className="w-4 h-4 text-ink-600 mx-auto mt-1 mb-0.5" />
          <div className="text-xs text-ink-500">Total reviews</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
          <div style={{ fontFamily: 'var(--font-display)' }} className="text-4xl text-brand-400">
            {reviews?.filter(r => r.comment).length || 0}
          </div>
          <MessageSquare className="w-4 h-4 text-ink-600 mx-auto mt-1 mb-0.5" />
          <div className="text-xs text-ink-500">With comments</div>
        </div>
      </div>

      {/* Breakdown */}
      {worker.review_count > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-white mb-4">Rating breakdown</h2>
          <div className="space-y-2">
            {([5, 4, 3, 2, 1] as const).map(star => {
              const count = breakdown[star] || 0
              const pct = worker.review_count > 0 ? (count / worker.review_count) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-ink-400 w-4">{star}</span>
                  <Star className="w-3.5 h-3.5 text-gold-500 fill-current flex-shrink-0" />
                  <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-ink-500 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div>
        <h2 className="font-semibold text-white mb-4">
          All reviews
          {worker.review_count > 0 && (
            <span className="text-ink-500 font-normal ml-2">({worker.review_count})</span>
          )}
        </h2>

        {!reviews || reviews.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Star className="w-10 h-10 text-ink-700 mx-auto mb-4" />
            <p className="text-ink-400 font-medium">No reviews yet</p>
            <p className="text-ink-600 text-sm mt-2">Share your QR code to start collecting reviews.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div key={review.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-gold-500 fill-current' : 'text-ink-600'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-ink-600">{timeAgo(review.created_at)}</span>
                </div>

                {review.comment && (
                  <p className="text-ink-300 text-sm mt-3 leading-relaxed">"{review.comment}"</p>
                )}

                <p className="text-ink-600 text-xs mt-3">
                  — {review.reviewer_name || 'Anonymous'}
                  {review.is_verified && (
                    <span className="ml-2 text-brand-600">✓ Verified</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
