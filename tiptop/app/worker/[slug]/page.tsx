export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/supabase/server'
import { formatRating, formatCount, tradeCategoryLabel, timeAgo, getInitials } from '@/lib/utils'
import { BADGE_TIER_COLORS, BADGE_TIER_EMOJI } from '@/lib/badges'
import { Star, Award, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = createAdminClient()
  const { data: worker } = await admin
    .from('workers')
    .select('display_name, trade_category, overall_rating, review_count')
    .eq('slug', params.slug)
    .eq('is_public', true)
    .single()

  if (!worker) {
    return { title: 'Worker Not Found' }
  }

  return {
    title: `${worker.display_name} — ${formatRating(worker.overall_rating)}★ on TipTop`,
    description: `${worker.display_name} has ${worker.review_count} verified reviews with a ${formatRating(worker.overall_rating)}/5 rating on TipTop.report.`,
  }
}

export default async function WorkerProfilePage({ params }: Props) {
  const admin = createAdminClient()

  const { data: worker, error } = await admin
    .from('workers')
    .select(`
      *,
      worker_badges(
        awarded_at,
        badge:badges(*)
      )
    `)
    .eq('slug', params.slug)
    .eq('is_public', true)
    .single()

  if (error || !worker) {
    notFound()
  }

  const { data: reviews } = await admin
    .from('reviews')
    .select('*')
    .eq('worker_id', worker.id)
    .eq('is_flagged', false)
    .order('created_at', { ascending: false })
    .limit(20)

  // Rating breakdown
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews?.forEach(r => { breakdown[r.rating as keyof typeof breakdown]++ })

  const totalReviews = worker.review_count || 0

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-brand-950/50 to-ink-950 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
              {worker.avatar_url ? (
                <img src={worker.avatar_url} alt={worker.display_name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span style={{ fontFamily: 'var(--font-display)' }} className="text-3xl text-brand-400">
                  {getInitials(worker.display_name)}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl text-white">
                    {worker.display_name}
                  </h1>
                  <p className="text-ink-400 mt-1">{tradeCategoryLabel(worker.trade_category)}</p>
                </div>

                {/* Rating bubble */}
                <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center flex-shrink-0">
                  <div style={{ fontFamily: 'var(--font-display)' }} className="text-3xl text-brand-400">
                    {totalReviews > 0 ? formatRating(worker.overall_rating) : '—'}
                  </div>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(worker.overall_rating) ? 'text-gold-500 fill-current' : 'text-ink-600'}`} />
                    ))}
                  </div>
                  <div className="text-xs text-ink-500 mt-1">{formatCount(totalReviews)} reviews</div>
                </div>
              </div>

              {worker.bio && (
                <p className="text-ink-400 mt-3 text-sm leading-relaxed">{worker.bio}</p>
              )}

              {/* Badges row */}
              {worker.worker_badges && worker.worker_badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {worker.worker_badges.slice(0, 5).map((wb: never) => {
                    const badge = (wb as { badge: { tier: string; name: string } }).badge
                    const colors = BADGE_TIER_COLORS[badge.tier] || BADGE_TIER_COLORS.bronze
                    return (
                      <span key={(wb as { badge: { id: string } }).badge.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {BADGE_TIER_EMOJI[badge.tier]} {badge.name}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Rating breakdown */}
        {totalReviews > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Rating breakdown</h2>
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map(star => {
                const count = breakdown[star] || 0
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm text-ink-400 w-4">{star}</span>
                    <Star className="w-3.5 h-3.5 text-gold-500 fill-current flex-shrink-0" />
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm text-ink-500 w-8 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div>
          <h2 className="font-semibold text-white mb-4">
            Reviews {totalReviews > 0 && <span className="text-ink-500 font-normal">({formatCount(totalReviews)})</span>}
          </h2>

          {!reviews || reviews.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <Star className="w-8 h-8 text-ink-600 mx-auto mb-3" />
              <p className="text-ink-500">No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-gold-500 fill-current' : 'text-ink-600'}`} />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-ink-300 text-sm mt-2 leading-relaxed">"{review.comment}"</p>
                      )}
                      <p className="text-ink-600 text-xs mt-2">
                        {review.reviewer_name ? review.reviewer_name : 'Anonymous'} · {timeAgo(review.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-12 text-ink-600 text-sm">
        <a href="https://tiptop.report" className="text-brand-600 hover:text-brand-400 transition-colors font-medium">
          TipTop.report
        </a>{' '}
        — Your reputation travels with you
      </div>
    </div>
  )
}
