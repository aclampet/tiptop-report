import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const admin = createAdminClient()

    const { data: token, error: tokenError } = await admin
      .from('qr_tokens')
      .select(`
        id,
        is_active,
        worker:workers(
          display_name,
          trade_category,
          avatar_url,
          overall_rating,
          review_count
        )
      `)
      .eq('id', params.tokenId)
      .single()

    if (tokenError || !token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    if (!token.is_active) {
      return NextResponse.json({ error: 'Token inactive' }, { status: 410 })
    }

    return NextResponse.json({ worker: token.worker })
  } catch (err) {
    console.error('GET /api/qr-tokens/[tokenId]/worker error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
