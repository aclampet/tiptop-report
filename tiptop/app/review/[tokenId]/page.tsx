'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Star, CheckCircle, AlertCircle } from 'lucide-react'
import { getDeviceFingerprint, tradeCategoryLabel, getInitials } from '@/lib/utils'

interface WorkerInfo {
  display_name: string
  trade_category: string
  avatar_url: string | null
  overall_rating: number
  review_count: number
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error' | 'already_reviewed'

export default function ReviewPage() {
  const { tokenId } = useParams<{ tokenId: string }>()

  const [worker, setWorker] = useState<WorkerInfo | null>(null)
  const [loadingWorker, setLoadingWorker] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')

  // Load worker info from token
  useEffect(() => {
    async function loadWorker() {
      try {
        const res = await fetch(`/api/qr-tokens/${tokenId}/worker`)
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const data = await res.json()
        setWorker(data.worker)
      } catch {
        setNotFound(true)
      } finally {
        setLoadingWorker(false)
      }
    }
    if (tokenId) loadWorker()
  }, [tokenId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) return

    setSubmitState('loading')

    try {
      const fingerprint = await getDeviceFingerprint()

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_token_id: tokenId,
          rating,
          comment: comment.trim() || undefined,
          reviewer_name: reviewerName.trim() || undefined,
          fingerprint,
        }),
      })

      const data = await res.json()

      if (res.status === 429 && data.already_reviewed) {
        setSubmitState('already_reviewed')
        return
      }

      if (!res.ok) {
        setSubmitState('error')
        return
      }

      setSubmitState('success')
    } catch {
      setSubmitState('error')
    }
  }

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
  const displayRating = hoverRating || rating

  if (loadingWorker) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-ink-600 mx-auto mb-4" />
          <h1 className="text-white text-xl font-semibold mb-2">QR code not found</h1>
          <p className="text-ink-500">This QR code may have been deactivated or doesn't exist.</p>
        </div>
      </div>
    )
  }

  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-brand-600/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-400" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl text-white mb-3">
            Thank you!
          </h1>
          <p className="text-ink-400 mb-2">
            Your review for <strong className="text-white">{worker?.display_name}</strong> has been saved.
          </p>
          <p className="text-ink-600 text-sm">
            This review is now part of their permanent professional record.
          </p>

          <div className="mt-8">
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-6 h-6 ${s <= rating ? 'text-gold-500 fill-current' : 'text-ink-700'}`} />
              ))}
            </div>
            <p className="text-xs text-ink-600 mt-4">
              Powered by{' '}
              <a href="https://tiptop.review" className="text-brand-600 hover:text-brand-400">TipTop.review</a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (submitState === 'already_reviewed') {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl text-white mb-3">
            Already reviewed
          </h1>
          <p className="text-ink-400">
            You've already left a review for {worker?.display_name} recently. Come back in 24 hours.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Worker card */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center flex-shrink-0">
            {worker?.avatar_url ? (
              <img src={worker.avatar_url} alt={worker.display_name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              <span style={{ fontFamily: 'var(--font-display)' }} className="text-xl text-brand-400">
                {getInitials(worker?.display_name || '?')}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg">{worker?.display_name}</h2>
            <p className="text-ink-500 text-sm">{tradeCategoryLabel(worker?.trade_category || '')}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl text-white mb-1">
            Leave a review
          </h1>
          <p className="text-ink-500 text-sm mb-8">This review stays with them forever.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star rating */}
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-3">Your rating *</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-10 h-10 transition-all duration-150 ${
                        star <= displayRating
                          ? 'text-gold-500 fill-current drop-shadow-sm'
                          : 'text-ink-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {displayRating > 0 && (
                <p className="text-center text-sm text-brand-400 mt-2 font-medium animate-fade-in">
                  {ratingLabels[displayRating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">
                Comment <span className="text-ink-600 font-normal">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-ink-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                placeholder="What made this experience great?"
              />
              <p className="text-right text-xs text-ink-600 mt-1">{comment.length}/500</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1.5">
                Your name <span className="text-ink-600 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                maxLength={100}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-ink-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                placeholder="Anonymous"
              />
            </div>

            {submitState === 'error' && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Something went wrong. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={rating === 0 || submitState === 'loading'}
              className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:pointer-events-none text-white py-4 rounded-xl font-semibold text-lg transition-all active:scale-95 shadow-glow-teal"
            >
              {submitState === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit review'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-ink-600 mt-6">
            Powered by{' '}
            <a href="https://tiptop.review" className="text-brand-600 hover:text-brand-400">TipTop.review</a>
          </p>
        </div>
      </div>
    </div>
  )
}
