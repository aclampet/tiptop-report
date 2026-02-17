'use client'

import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Plus, Download, Power, PowerOff, QrCode, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { getReviewQRUrl } from '@/lib/utils'
import type { QRToken } from '@/types'

interface Props {
  tokens: QRToken[]
  workerName: string
  workerId: string
}

export default function QRCodeManager({ tokens: initialTokens, workerName, workerId }: Props) {
  const [tokens, setTokens] = useState<QRToken[]>(initialTokens)
  const [selectedToken, setSelectedToken] = useState<QRToken | null>(initialTokens[0] || null)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const reviewUrl = selectedToken ? getReviewQRUrl(selectedToken.id) : ''

  async function createToken() {
    if (!newLabel.trim()) return
    setCreating(true)

    try {
      const res = await fetch('/api/qr-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLabel.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Failed to create QR code')
        return
      }

      const { token } = await res.json()
      const newTokens = [token, ...tokens]
      setTokens(newTokens)
      setSelectedToken(token)
      setNewLabel('')
      setShowNewForm(false)
      toast.success('New QR code created!')
    } finally {
      setCreating(false)
    }
  }

  async function toggleToken(tokenId: string, isActive: boolean) {
    const res = await fetch('/api/qr-tokens', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tokenId, is_active: !isActive }),
    })

    if (res.ok) {
      const { token: updated } = await res.json()
      setTokens(prev => prev.map(t => t.id === tokenId ? updated : t))
      if (selectedToken?.id === tokenId) setSelectedToken(updated)
      toast.success(isActive ? 'QR code deactivated' : 'QR code activated')
    }
  }

  function downloadQR() {
    if (!qrRef.current || !selectedToken) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    // Add padding and branding to SVG
    const svgData = svg.outerHTML
    const canvas = document.createElement('canvas')
    const size = 400
    canvas.width = size
    canvas.height = size + 60

    const ctx = canvas.getContext('2d')!
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      // White background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size + 60)

      // QR code
      ctx.drawImage(img, 20, 20, size - 40, size - 40)

      // Label text
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(workerName, size / 2, size + 12)

      ctx.fillStyle = '#64748b'
      ctx.font = '11px sans-serif'
      ctx.fillText('Scan to leave a review • TipTop.report', size / 2, size + 30)

      URL.revokeObjectURL(url)

      const link = document.createElement('a')
      link.download = `tiptop-qr-${selectedToken.label.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    img.src = url
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(reviewUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Review link copied!')
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Token list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Your codes ({tokens.length})</h2>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-medium"
          >
            <Plus className="w-4 h-4" />
            New code
          </button>
        </div>

        {/* New token form */}
        {showNewForm && (
          <div className="bg-brand-600/10 border border-brand-500/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-ink-400 mb-3">Give this QR code a label (e.g. "Front Desk", "Hotel Aria")</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="My QR Code"
                maxLength={60}
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-ink-600 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                onKeyDown={e => e.key === 'Enter' && createToken()}
                autoFocus
              />
              <button
                onClick={createToken}
                disabled={creating || !newLabel.trim()}
                className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
              >
                {creating ? '...' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* Token list */}
        <div className="space-y-2">
          {tokens.length === 0 ? (
            <div className="text-center py-8 text-ink-500 text-sm">
              No QR codes yet. Create one above.
            </div>
          ) : (
            tokens.map(token => (
              <div
                key={token.id}
                onClick={() => setSelectedToken(token)}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedToken?.id === token.id
                    ? 'bg-brand-600/10 border-brand-500/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <QrCode className={`w-5 h-5 ${token.is_active ? 'text-brand-400' : 'text-ink-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${token.is_active ? 'text-white' : 'text-ink-500'}`}>
                      {token.label}
                    </p>
                    <p className="text-xs text-ink-600">{token.scan_count} scans</p>
                  </div>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); toggleToken(token.id, token.is_active) }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    token.is_active
                      ? 'text-brand-400 hover:bg-brand-500/10'
                      : 'text-ink-600 hover:bg-white/10'
                  }`}
                  title={token.is_active ? 'Deactivate' : 'Activate'}
                >
                  {token.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* QR display */}
      <div>
        {selectedToken ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-white">{selectedToken.label}</h2>
                <p className="text-xs text-ink-500">{selectedToken.scan_count} total scans</p>
              </div>
              {!selectedToken.is_active && (
                <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-lg">
                  Inactive
                </span>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6" ref={qrRef}>
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <QRCodeSVG
                  value={reviewUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>
            </div>

            {/* Review URL */}
            <div className="bg-black/20 rounded-xl p-3 mb-4 flex items-center gap-2">
              <p className="text-xs text-ink-500 flex-1 font-mono truncate">{reviewUrl}</p>
              <button onClick={copyUrl} className="text-ink-400 hover:text-brand-400 transition-colors flex-shrink-0">
                {copied ? <Check className="w-4 h-4 text-brand-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={downloadQR}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </button>
              <button
                onClick={copyUrl}
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy link
              </button>
            </div>

            <p className="text-center text-xs text-ink-600 mt-4">
              Print and display this QR code at your workspace
            </p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <QrCode className="w-12 h-12 text-ink-700 mx-auto mb-3" />
            <p className="text-ink-500">Select a QR code to view it</p>
          </div>
        )}
      </div>
    </div>
  )
}
