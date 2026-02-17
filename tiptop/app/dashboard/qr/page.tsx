export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'
import QRCodeManager from '@/components/qr/QRCodeManager'

export default async function QRDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: worker } = await supabase
    .from('workers')
    .select('id, display_name, slug')
    .eq('auth_user_id', user.id)
    .single()

  if (!worker) redirect('/signup')

  const { data: tokens } = await supabase
    .from('qr_tokens')
    .select('*')
    .eq('worker_id', worker.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl text-white">QR Codes</h1>
        <p className="text-ink-500 mt-1">Manage your review QR codes. Each code links to your permanent profile.</p>
      </div>
      <QRCodeManager
        tokens={tokens || []}
        workerName={worker.display_name}
        workerId={worker.id}
      />
    </div>
  )
}
