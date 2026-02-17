import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase/server'
import { sendNewReviewEmail } from '@/lib/email'
import { checkBadgeEligibility } from '@/lib/badges'

// Rate limit store (in-memory for now; use Vercel KV in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(fingerprint: string, workerId: string): boolean {
  const key = `${fingerprint}:${workerId}`
  const now = Date.now()
  const window = 24 * 60 * 60 * 1000 // 24 hours

  const entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + window })
    return true // allowed
  }

  if (entry.count >= 1) {
    return false // rate limited
  }

  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const body = await request.json()
    const { qr_token_id, rating, comment, reviewer_name, fingerprint } = body

    // Validate input
    if (!qr_token_id || !rating || !fingerprint) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    // Validate QR token exists and is active
    const { data: token, error: tokenError } = await admin
      .from('qr_tokens')
      .select('id, worker_id, is_active, scan_count')
      .eq('id', qr_token_id)
      .single()

    if (tokenError || !token) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 })
    }

    if (!token.is_active) {
      return NextResponse.json({ error: 'This QR code is no longer active' }, { status: 410 })
    }

    // Rate limit check
    const allowed = checkRateLimit(fingerprint, token.worker_id)
    if (!allowed) {
      return NextResponse.json(
        { error: 'You have already reviewed this person recently', already_reviewed: true },
        { status: 429 }
      )
    }

    // Insert review
    const { data: review, error: reviewError } = await admin
      .from('reviews')
      .insert({
        worker_id: token.worker_id,
        qr_token_id,
        rating,
        comment: comment?.trim() || null,
        reviewer_name: reviewer_name?.trim() || null,
        reviewer_fingerprint: fingerprint,
        is_verified: true,
        is_flagged: false,
      })
      .select()
      .single()

    if (reviewError) {
      console.error('Review insert error:', reviewError)
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
    }

    // Increment scan count
    await admin
      .from('qr_tokens')
      .update({ scan_count: token.scan_count + 1 })
      .eq('id', qr_token_id)

    // Update worker rating (trigger should handle this, but also do it here as fallback)
    const { data: allReviews } = await admin
      .from('reviews')
      .select('rating')
      .eq('worker_id', token.worker_id)

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      await admin
        .from('workers')
        .update({
          overall_rating: Math.round(avgRating * 100) / 100,
          review_count: allReviews.length,
        })
        .eq('id', token.worker_id)
    }

    // Check and award badges
    const { data: worker } = await admin
      .from('workers')
      .select('*')
      .eq('id', token.worker_id)
      .single()

    if (worker) {
      const { data: allBadges } = await admin.from('badges').select('*')
      const { data: workerBadges } = await admin
        .from('worker_badges')
        .select('badge_id')
        .eq('worker_id', token.worker_id)

      if (allBadges && workerBadges && allReviews) {
        const existingBadgeIds = workerBadges.map(wb => wb.badge_id)
        const fullReviews = allReviews.map((r, i) => ({ ...r, id: String(i), worker_id: token.worker_id } as never))
        const newBadgeIds = checkBadgeEligibility(worker, fullReviews, allBadges, existingBadgeIds)

        if (newBadgeIds.length > 0) {
          await admin.from('worker_badges').insert(
            newBadgeIds.map(badge_id => ({
              worker_id: token.worker_id,
              badge_id,
              awarded_by: 'system',
            }))
          )
        }
      }

      // Send email notification to worker
      const { data: authUser } = await admin.auth.admin.getUserById(worker.auth_user_id)
      if (authUser.user?.email) {
        sendNewReviewEmail({
          workerEmail: authUser.user.email,
          workerName: worker.display_name,
          reviewerName: reviewer_name,
          rating,
          comment,
          workerSlug: worker.slug,
        }).catch(console.error)
      }
    }

    return NextResponse.json({ success: true, review_id: review.id }, { status: 201 })
  } catch (err) {
    console.error('POST /api/reviews error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const { searchParams } = new URL(request.url)
    const workerId = searchParams.get('worker_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!workerId) {
      return NextResponse.json({ error: 'worker_id required' }, { status: 400 })
    }

    const { data: reviews, error, count } = await admin
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('worker_id', workerId)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews, total: count })
  } catch (err) {
    console.error('GET /api/reviews error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
