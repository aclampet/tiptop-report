export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Star, QrCode, Award, Settings, LogOut, ExternalLink } from 'lucide-react'
import LogoutButton from '@/components/dashboard/LogoutButton'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/reviews', label: 'Reviews', icon: Star },
  { href: '/dashboard/qr', label: 'QR Codes', icon: QrCode },
  { href: '/dashboard/badges', label: 'Badges', icon: Award },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: worker } = await supabase
    .from('workers')
    .select('display_name, slug, overall_rating, review_count')
    .eq('auth_user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-ink-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-2xl text-brand-400">TipTop</span>
        </div>

        {/* Worker info */}
        {worker && (
          <div className="px-4 py-4 border-b border-white/5">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="font-medium text-white text-sm truncate">{worker.display_name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="w-3 h-3 text-gold-500 fill-current" />
                <span className="text-xs text-ink-400">
                  {worker.review_count > 0 ? worker.overall_rating.toFixed(1) : '—'} · {worker.review_count} reviews
                </span>
              </div>
              <Link
                href={`/worker/${worker.slug}`}
                target="_blank"
                className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-400 mt-2 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View profile
              </Link>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-400 hover:text-white hover:bg-white/5 transition-all group"
            >
              <item.icon className="w-4 h-4 group-hover:text-brand-400 transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-1 border-t border-white/5 pt-3">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
