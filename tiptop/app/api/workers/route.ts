import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const admin = createAdminClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { display_name, slug, trade_category, bio } = body

    if (!display_name || !slug || !trade_category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check slug uniqueness
    const { data: existing } = await admin
      .from('workers')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }

    // Create worker profile
    const { data: worker, error: workerError } = await admin
      .from('workers')
      .insert({
        auth_user_id: user.id,
        display_name,
        slug,
        trade_category,
        bio: bio || null,
        overall_rating: 0,
        review_count: 0,
        is_public: true,
      })
      .select()
      .single()

    if (workerError) {
      console.error('Worker insert error:', workerError)
      return NextResponse.json({ error: 'Failed to create worker profile' }, { status: 500 })
    }

    // Auto-create first QR token
    const { error: qrError } = await admin
      .from('qr_tokens')
      .insert({
        worker_id: worker.id,
        label: 'My QR Code',
        scan_count: 0,
        is_active: true,
      })

    if (qrError) {
      console.error('QR token insert error:', qrError)
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail({
      email: user.email!,
      displayName: display_name,
      workerSlug: slug,
    }).catch(console.error)

    return NextResponse.json({ worker }, { status: 201 })
  } catch (err) {
    console.error('POST /api/workers error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: worker, error } = await supabase
      .from('workers')
      .select(`
        *,
        worker_badges(
          *,
          badge:badges(*)
        )
      `)
      .eq('auth_user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
    }

    return NextResponse.json({ worker })
  } catch (err) {
    console.error('GET /api/workers error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { display_name, bio, trade_category, is_public } = body

    const { data: worker, error } = await supabase
      .from('workers')
      .update({
        ...(display_name !== undefined && { display_name }),
        ...(bio !== undefined && { bio }),
        ...(trade_category !== undefined && { trade_category }),
        ...(is_public !== undefined && { is_public }),
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ worker })
  } catch (err) {
    console.error('PATCH /api/workers error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
