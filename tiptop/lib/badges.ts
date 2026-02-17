import type { Badge, Worker, Review } from '@/types'

export interface BadgeCheckResult {
  badge_id: string
  should_award: boolean
}

export function checkBadgeEligibility(
  worker: Worker,
  reviews: Review[],
  allBadges: Badge[],
  existingBadgeIds: string[]
): string[] {
  const newBadgeIds: string[] = []

  for (const badge of allBadges) {
    // Skip already awarded badges
    if (existingBadgeIds.includes(badge.id)) continue

    const criteria = badge.criteria_json
    let eligible = false

    switch (criteria.type) {
      case 'review_count':
        eligible = worker.review_count >= (criteria.threshold ?? 0)
        break

      case 'rating_threshold':
        eligible =
          worker.overall_rating >= (criteria.threshold ?? 0) &&
          worker.review_count >= (criteria.min_reviews ?? 1)
        break

      case 'streak': {
        const recentReviews = reviews
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, criteria.threshold ?? 10)

        if (recentReviews.length >= (criteria.threshold ?? 10)) {
          if (criteria.consecutive) {
            eligible = recentReviews.every(r => r.rating === 5)
          } else {
            eligible = recentReviews.every(r => r.rating >= 4.0)
          }
        }
        break
      }

      case 'manual':
        // Manual badges are awarded by admins only, skip
        eligible = false
        break
    }

    if (eligible) {
      newBadgeIds.push(badge.id)
    }
  }

  return newBadgeIds
}

export const BADGE_TIER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  bronze: {
    bg: 'bg-amber-900/20',
    text: 'text-amber-600',
    border: 'border-amber-600/30',
    glow: 'shadow-amber-500/20',
  },
  silver: {
    bg: 'bg-slate-400/10',
    text: 'text-slate-400',
    border: 'border-slate-400/30',
    glow: 'shadow-slate-400/20',
  },
  gold: {
    bg: 'bg-yellow-400/10',
    text: 'text-yellow-500',
    border: 'border-yellow-400/30',
    glow: 'shadow-yellow-400/30',
  },
  platinum: {
    bg: 'bg-teal-400/10',
    text: 'text-teal-400',
    border: 'border-teal-400/30',
    glow: 'shadow-teal-400/30',
  },
}

export const BADGE_TIER_EMOJI: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
}
