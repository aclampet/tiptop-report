export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/supabase/server'
import { BADGE_TIER_COLORS, BADGE_TIER_EMOJI } from '@/lib/badges'
import { timeAgo } from '@/lib/utils'
import { Award, Lock } from 'lucide-react'

export default async function BadgesDashboardPage() {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: worker } = await supabase
    .from('workers')
    .select('id, overall_rating, review_count')
    .eq('auth_user_id', user.id)
    .single()

  if (!worker) redirect('/signup')

  // Get all badges and which ones the worker has
  const [{ data: allBadges }, { data: workerBadges }] = await Promise.all([
    admin.from('badges').select('*').order('tier'),
    admin.from('worker_badges')
      .select('*, badge:badges(*)')
      .eq('worker_id', worker.id)
  ])

  const earnedBadgeIds = new Set(workerBadges?.map(wb => wb.badge_id) || [])

  const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 }
  const sortedBadges = allBadges?.sort((a, b) =>
    (tierOrder[a.tier as keyof typeof tierOrder] || 0) - (tierOrder[b.tier as keyof typeof tierOrder] || 0)
  ) || []

  const earnedCount = workerBadges?.length || 0
  const totalCount = allBadges?.length || 0

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl text-white">Badges</h1>
        <p className="text-ink-500 mt-1">
          {earnedCount} of {totalCount} badges earned
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Collection progress</span>
          <span className="text-sm text-ink-500">{earnedCount}/{totalCount}</span>
        </div>
        <div className="bg-white/5 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
            style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }}
          />
        </div>

        {/* Tier counts */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {(['bronze', 'silver', 'gold', 'platinum'] as const).map(tier => {
            const tierBadges = sortedBadges.filter(b => b.tier === tier)
            const earned = tierBadges.filter(b => earnedBadgeIds.has(b.id)).length
            const colors = BADGE_TIER_COLORS[tier]
            return (
              <div key={tier} className={`rounded-xl p-3 border ${colors.bg} ${colors.border} text-center`}>
                <div className="text-lg">{BADGE_TIER_EMOJI[tier]}</div>
                <div className={`text-sm font-semibold ${colors.text}`}>{earned}/{tierBadges.length}</div>
                <div className="text-xs text-ink-600 capitalize">{tier}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {sortedBadges.map(badge => {
          const earned = earnedBadgeIds.has(badge.id)
          const colors = BADGE_TIER_COLORS[badge.tier] || BADGE_TIER_COLORS.bronze
          const workerBadge = workerBadges?.find(wb => wb.badge_id === badge.id)

          return (
            <div
              key={badge.id}
              className={`relative rounded-2xl p-5 border transition-all ${
                earned
                  ? `${colors.bg} ${colors.border} shadow-lg`
                  : 'bg-white/5 border-white/5 opacity-50'
              }`}
            >
              {!earned && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-ink-700" />
                </div>
              )}

              <div className={`text-2xl mb-2 ${!earned ? 'grayscale opacity-40' : ''}`}>
                {BADGE_TIER_EMOJI[badge.tier]}
              </div>

              <h3 className={`font-semibold text-sm mb-1 ${earned ? 'text-white' : 'text-ink-700'}`}>
                {badge.name}
              </h3>

              <p className={`text-xs leading-relaxed ${earned ? 'text-ink-400' : 'text-ink-700'}`}>
                {badge.description}
              </p>

              {earned && workerBadge && (
                <p className={`text-xs mt-3 ${colors.text}`}>
                  ✓ Earned {timeAgo(workerBadge.awarded_at)}
                </p>
              )}

              <span className={`absolute top-3 right-3 text-xs font-semibold ${colors.text} capitalize`}>
                {badge.tier}
              </span>
            </div>
          )
        })}

        {sortedBadges.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <Award className="w-10 h-10 text-ink-700 mx-auto mb-3" />
            <p className="text-ink-500">No badges configured yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
