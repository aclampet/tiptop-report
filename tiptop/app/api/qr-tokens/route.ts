import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get worker id
    const { data: worker } = await supabase
      .from('workers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
    }

    const { data: tokens, error } = await supabase
      .from('qr_tokens')
      .select('*')
      .eq('worker_id', worker.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch QR tokens' }, { status: 500 })
    }

    return NextResponse.json({ tokens })
  } catch (err) {
    console.error('GET /api/qr-tokens error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const admin = createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { label } = body

    if (!label?.trim()) {
      return NextResponse.json({ error: 'Label is required' }, { status: 400 })
    }

    // Get worker id
    const { data: worker } = await supabase
      .from('workers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 })
    }

    // Check token limit (max 10 active per worker on free plan)
    const { count } = await admin
      .from('qr_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('worker_id', worker.id)
      .eq('is_active', true)

    if ((count || 0) >= 10) {
      return NextResponse.json({ error: 'Maximum 10 active QR codes per account' }, { status: 429 })
    }

    const { data: token, error } = await admin
      .from('qr_tokens')
      .insert({
        worker_id: worker.id,
        label: label.trim(),
        scan_count: 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create QR token' }, { status: 500 })
    }

    return NextResponse.json({ token }, { status: 201 })
  } catch (err) {
    console.error('POST /api/qr-tokens error:', err)
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
    const { id, label, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 })
    }

    // Verify ownership
    const { data: worker } = await supabase
      .from('workers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    const { data: token, error } = await supabase
      .from('qr_tokens')
      .update({
        ...(label !== undefined && { label }),
        ...(is_active !== undefined && { is_active }),
      })
      .eq('id', id)
      .eq('worker_id', worker?.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update QR token' }, { status: 500 })
    }

    return NextResponse.json({ token })
  } catch (err) {
    console.error('PATCH /api/qr-tokens error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
