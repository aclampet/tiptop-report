export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'
import { formatRating, formatCount, tradeCategoryLabel, timeAgo, getReviewQRUrl } from '@/lib/utils'
import { BADGE_TIER_COLORS, BADGE_TIER_EMOJI } from '@/lib/badges'
import { Star, TrendingUp, QrCode, Award, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: worker } = await supabase
    .from('workers')
    .select(`
      *,
      worker_badges(awarded_at, badge:badges(*))
    `)
    .eq('auth_user_id', user.id)
    .single()

  if (!worker) redirect('/signup')

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('worker_id', worker.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: qrTokens } = await supabase
    .from('qr_tokens')
    .select('*')
    .eq('worker_id', worker.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)

  const firstToken = qrTokens?.[0]

  const recentBadge = worker.worker_badges
    ?.sort((a: { awarded_at: string }, b: { awarded_at: string }) =>
      new Date(b.awarded_at).getTime() - new Date(a.awarded_at).getTime()
    )[0]

  return (
    <div className="p-8 max-w-5xl">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl text-white">
          Welcome back, {worker.display_name.split(' ')[0]}
        </h1>
        <p className="text-ink-500 mt-1">{tradeCategoryLabel(worker.trade_category)}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Overall Rating',
            value: worker.review_count > 0 ? formatRating(worker.overall_rating) : '—',
            sub: worker.review_count > 0 ? 'out of 5.0' : 'No reviews yet',
            icon: <Star className="w-5 h-5" />,
            color: 'text-gold-500',
          },
          {
            label: 'Total Reviews',
            value: formatCount(worker.review_count),
            sub: 'verified reviews',
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-brand-400',
          },
          {
            label: 'Badges Earned',
            value: String(worker.worker_badges?.length || 0),
            sub: 'achievements',
            icon: <Award className="w-5 h-5" />,
            color: 'text-purple-400',
          },
          {
            label: 'QR Scans',
            value: formatCount(qrTokens?.reduce((sum: number, t: { scan_count: number }) => sum + t.scan_count, 0) || 0),
            sub: 'total scans',
            icon: <QrCode className="w-5 h-5" />,
            color: 'text-teal-400',
          },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className={`${stat.color} mb-3`}>{stat.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)' }} className="text-3xl text-white">{stat.value}</div>
            <div className="text-xs text-ink-500 mt-1">{stat.label}</div>
            <div className="text-xs text-ink-700 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent reviews */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent reviews</h2>
            <Link href="/dashboard/reviews" className="text-xs text-brand-500 hover:text-brand-400 flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {!reviews || reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-8 h-8 text-ink-700 mx-auto mb-3" />
              <p className="text-ink-500 text-sm">No reviews yet.</p>
              {firstToken && (
                <p className="text-ink-600 text-xs mt-2">
                  Share your QR code to start collecting reviews.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                  <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-gold-500 fill-current' : 'text-ink-700'}`} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    {review.comment && (
                      <p className="text-sm text-ink-300 truncate">"{review.comment}"</p>
                    )}
                    <p className="text-xs text-ink-600 mt-0.5">
                      {review.reviewer_name || 'Anonymous'} · {timeAgo(review.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* QR Code quick action */}
          {firstToken && (
            <div className="bg-brand-600/10 border border-brand-500/20 rounded-2xl p-5">
              <QrCode className="w-6 h-6 text-brand-400 mb-3" />
              <h3 className="font-semibold text-white text-sm mb-1">Your QR code</h3>
              <p className="text-ink-500 text-xs mb-4">Share this link to collect reviews</p>
              <Link
                href="/dashboard/qr"
                className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
              >
                View & download QR
              </Link>
            </div>
          )}

          {/* Latest badge */}
          {recentBadge ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Award className="w-5 h-5 text-purple-400 mb-3" />
              <h3 className="font-semibold text-white text-sm mb-1">Latest badge</h3>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border mt-2 ${
                BADGE_TIER_COLORS[recentBadge.badge.tier]?.bg
              } ${BADGE_TIER_COLORS[recentBadge.badge.tier]?.text} ${BADGE_TIER_COLORS[recentBadge.badge.tier]?.border}`}>
                {BADGE_TIER_EMOJI[recentBadge.badge.tier]} {recentBadge.badge.name}
              </div>
              <p className="text-ink-600 text-xs mt-2">{timeAgo(recentBadge.awarded_at)}</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <Award className="w-5 h-5 text-ink-600 mb-3" />
              <h3 className="font-semibold text-white text-sm mb-1">Earn your first badge</h3>
              <p className="text-ink-500 text-xs">Collect your first review to unlock the First Review badge.</p>
              <Link href="/dashboard/badges" className="text-xs text-brand-500 hover:text-brand-400 flex items-center gap-1 mt-3">
                View badges <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Profile link */}
          <Link
            href={`/worker/${worker.slug}`}
            target="_blank"
            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-brand-500/30 transition-all group"
          >
            <div>
              <p className="text-sm font-medium text-white">Your public profile</p>
              <p className="text-xs text-ink-500 mt-0.5 truncate">tiptop.review/worker/{worker.slug}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-ink-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  )
}
