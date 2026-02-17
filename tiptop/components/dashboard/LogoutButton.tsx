'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/supabase/client'
import toast from 'react-hot-toast'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-ink-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-left"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  )
}
