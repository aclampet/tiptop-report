import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM_EMAIL || 'notifications@tiptop.review'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tiptop.review'

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — emails will not be sent')
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendNewReviewEmail({
  workerEmail,
  workerName,
  reviewerName,
  rating,
  comment,
  workerSlug,
}: {
  workerEmail: string
  workerName: string
  reviewerName?: string | null
  rating: number
  comment?: string | null
  workerSlug: string
}) {
  const resend = getResend()
  if (!resend) return

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const reviewer = reviewerName || 'A customer'
  const dashboardUrl = `${APP_URL}/dashboard/reviews`

  try {
    await resend.emails.send({
      from: `TipTop <${FROM}>`,
      to: workerEmail,
      subject: `${stars} New ${rating}-star review from ${reviewer}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f8fafc;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 32px; font-weight: 800; color: #0d9488;">TipTop</span>
              </div>
              <h1 style="font-size: 24px; color: #0f172a; margin-bottom: 8px;">New review, ${workerName}! 🎉</h1>
              <p style="color: #64748b; margin-bottom: 24px;">${reviewer} left you a review.</p>
              <div style="background: #f0fdf9; border: 1px solid #99f6e0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="font-size: 28px; color: #f59e0b; margin-bottom: 12px;">${stars}</div>
                <p style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 8px;">${rating} out of 5 stars</p>
                ${comment ? `<p style="color: #334155; font-style: italic; margin: 0;">"${comment}"</p>` : ''}
              </div>
              <a href="${dashboardUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Your Reviews
              </a>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                TipTop.review — Your reputation travels with you.<br>
                <a href="${APP_URL}/worker/${workerSlug}" style="color: #0d9488;">View your public profile</a>
              </p>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send review notification email:', error)
  }
}

export async function sendWelcomeEmail({
  email,
  displayName,
  workerSlug,
}: {
  email: string
  displayName: string
  workerSlug: string
}) {
  const resend = getResend()
  if (!resend) return

  const profileUrl = `${APP_URL}/worker/${workerSlug}`
  const dashboardUrl = `${APP_URL}/dashboard`

  try {
    await resend.emails.send({
      from: `TipTop <${FROM}>`,
      to: email,
      subject: `Welcome to TipTop, ${displayName}! Your reputation starts now.`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f8fafc;">
            <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 32px; font-weight: 800; color: #0d9488;">TipTop</span>
              </div>
              <h1 style="font-size: 24px; color: #0f172a; margin-bottom: 8px;">Welcome, ${displayName}! 👋</h1>
              <p style="color: #64748b; margin-bottom: 24px;">Your professional reputation now belongs to you — not your employer.</p>
              <div style="background: #f0fdf9; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <h3 style="color: #0f172a; margin: 0 0 16px;">Get started in 3 steps:</h3>
                <p style="color: #334155; margin: 0 0 12px;">1️⃣ <strong>Download your QR code</strong> from your dashboard</p>
                <p style="color: #334155; margin: 0 0 12px;">2️⃣ <strong>Display it</strong> at your workspace or on your badge</p>
                <p style="color: #334155; margin: 0;">3️⃣ <strong>Watch reviews roll in</strong> and build your reputation</p>
              </div>
              <a href="${dashboardUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                Go to Dashboard
              </a>
              <a href="${profileUrl}" style="display: inline-block; background: #f1f5f9; color: #334155; padding: 14px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View My Profile
              </a>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                TipTop.review — Your reputation travels with you.
              </p>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}
