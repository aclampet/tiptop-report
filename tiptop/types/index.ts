// ─── Database Types ───────────────────────────────────────────────────────────

export type UserRole = 'worker' | 'employer' | 'admin'
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type BadgeCategory = 'volume' | 'rating' | 'streak' | 'specialty' | 'course'
export type CompanyPlan = 'free' | 'pro' | 'enterprise'
export type TradeCategory =
  | 'hospitality'
  | 'food_service'
  | 'delivery'
  | 'cleaning'
  | 'retail'
  | 'childcare'
  | 'healthcare_support'
  | 'beauty_wellness'
  | 'transportation'
  | 'maintenance'
  | 'security'
  | 'other'

export interface Worker {
  id: string
  auth_user_id: string
  display_name: string
  slug: string
  bio: string | null
  avatar_url: string | null
  trade_category: TradeCategory
  overall_rating: number
  review_count: number
  is_public: boolean
  created_at: string
  updated_at: string
  // Joined
  badges?: WorkerBadge[]
  recent_reviews?: Review[]
}

export interface Review {
  id: string
  worker_id: string
  qr_token_id: string
  employer_id: string | null
  rating: number
  comment: string | null
  reviewer_name: string | null
  reviewer_fingerprint: string
  is_verified: boolean
  is_flagged: boolean
  created_at: string
  // Joined
  worker?: Pick<Worker, 'display_name' | 'slug' | 'avatar_url'>
  employer?: Pick<Company, 'name' | 'logo_url'>
}

export interface QRToken {
  id: string
  worker_id: string
  label: string
  scan_count: number
  is_active: boolean
  created_at: string
}

export interface Badge {
  id: string
  name: string
  tier: BadgeTier
  category: BadgeCategory
  criteria_json: BadgeCriteria
  icon_url: string | null
  description: string
  created_at: string
}

export interface BadgeCriteria {
  type: 'review_count' | 'rating_threshold' | 'streak' | 'course_completion' | 'manual'
  threshold?: number
  min_reviews?: number
  consecutive?: boolean
  course_id?: string
}

export interface WorkerBadge {
  id: string
  worker_id: string
  badge_id: string
  awarded_at: string
  awarded_by: 'system' | 'employer' | 'admin'
  badge?: Badge
}

export interface Company {
  id: string
  auth_user_id: string
  name: string
  slug: string
  industry: string
  logo_url: string | null
  website: string | null
  is_certified: boolean
  plan_tier: CompanyPlan
  created_at: string
  updated_at: string
}

// ─── API Request/Response Types ───────────────────────────────────────────────

export interface SubmitReviewPayload {
  qr_token_id: string
  rating: number
  comment?: string
  reviewer_name?: string
  fingerprint: string
}

export interface SubmitReviewResponse {
  success: boolean
  review_id?: string
  error?: string
  already_reviewed?: boolean
}

export interface CreateWorkerPayload {
  display_name: string
  slug: string
  bio?: string
  trade_category: TradeCategory
}

export interface UpdateWorkerPayload {
  display_name?: string
  bio?: string
  trade_category?: TradeCategory
  is_public?: boolean
}

export interface CreateQRTokenPayload {
  label: string
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export interface RatingBreakdown {
  five: number
  four: number
  three: number
  two: number
  one: number
}

export interface DashboardStats {
  total_reviews: number
  overall_rating: number
  rating_breakdown: RatingBreakdown
  rating_trend: RatingTrendPoint[]
  badges_earned: number
  recent_reviews: Review[]
}

export interface RatingTrendPoint {
  date: string
  rating: number
  count: number
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  email: string
  password: string
  display_name: string
  trade_category: TradeCategory
}

export interface ReviewFormData {
  rating: number
  comment: string
  reviewer_name: string
}
