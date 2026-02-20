import Link from 'next/link'
import { Star, QrCode, Award, ArrowRight, CheckCircle, Users, TrendingUp, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ink-950 text-white overflow-hidden">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-ink-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-2xl text-brand-400">
            TipTop
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-400 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/signup"
              className="text-sm bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 relative">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-brand-400/5 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8 animate-fade-in">
            <Star className="w-3.5 h-3.5 fill-current" />
            Your reputation travels with you
          </div>

          <h1
            style={{ fontFamily: 'var(--font-display)', animationFillMode: 'forwards', animationDelay: '100ms' }}
            className="text-5xl md:text-7xl text-white leading-tight mb-6 animate-fade-up opacity-0-init"
          >
            Build a reputation
            <br />
            <em className="text-brand-400">no employer can take</em>
          </h1>

          <p className="text-lg md:text-xl text-ink-400 max-w-2xl mx-auto mb-10 animate-fade-up opacity-0-init"
            style={{ animationFillMode: 'forwards', animationDelay: '200ms' }}>
            Service workers get a QR code. Customers scan it, leave a review. That review follows
            you forever — through every job change, every new employer, every career move.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up opacity-0-init"
            style={{ animationFillMode: 'forwards', animationDelay: '300ms' }}>
            <Link href="/signup"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all active:scale-95 shadow-glow-teal">
              Get your free profile
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#how-it-works"
              className="flex items-center gap-2 text-ink-400 hover:text-white px-8 py-4 transition-colors">
              See how it works
            </Link>
          </div>

          {/* Social proof numbers */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-up opacity-0-init"
            style={{ animationFillMode: 'forwards', animationDelay: '400ms' }}>
            {[
              { value: '100%', label: 'Portable reviews' },
              { value: 'Free', label: 'Forever for workers' },
              { value: '∞', label: 'Career lifespan' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div style={{ fontFamily: 'var(--font-display)' }} className="text-3xl text-brand-400">{stat.value}</div>
                <div className="text-xs text-ink-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-4xl md:text-5xl text-white mb-4">
              Simple as a scan
            </h2>
            <p className="text-ink-400 text-lg">Three steps to a reputation that lasts a lifetime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <QrCode className="w-6 h-6" />,
                title: 'Get your QR code',
                desc: 'Sign up free and instantly receive your personal QR code. Print it, wear it, or display it at your workspace.',
              },
              {
                step: '02',
                icon: <Star className="w-6 h-6" />,
                title: 'Customers review you',
                desc: 'Customers scan the code with any phone. No app download needed. They rate and review in under 30 seconds.',
              },
              {
                step: '03',
                icon: <Award className="w-6 h-6" />,
                title: 'Your reputation grows',
                desc: 'Every review sticks to your permanent profile. Earn badges. Build a portfolio no employer can erase.',
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/8 hover:border-brand-500/30 transition-all duration-300">
                  <div className="text-brand-600/30 font-mono text-5xl font-bold mb-4">{item.step}</div>
                  <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-ink-400 leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-brand-600/30 text-2xl z-10">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-4xl md:text-5xl text-white mb-4">
              Everything you need to stand out
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <Shield className="w-5 h-5" />,
                title: 'Tamper-proof reviews',
                desc: 'Reviews are cryptographically verified and immutable. No one — not even us — can delete them.',
              },
              {
                icon: <Award className="w-5 h-5" />,
                title: 'Tiered badge system',
                desc: 'Earn Bronze, Silver, Gold, and Platinum badges for volume, rating quality, and consistency.',
              },
              {
                icon: <Users className="w-5 h-5" />,
                title: 'Employer-independent',
                desc: 'Your profile belongs to you. Change jobs, move cities, switch industries — your reviews come with you.',
              },
              {
                icon: <TrendingUp className="w-5 h-5" />,
                title: 'Performance dashboard',
                desc: 'Track your rating trends, review volume, and badge progress over time.',
              },
              {
                icon: <QrCode className="w-5 h-5" />,
                title: 'Multiple QR codes',
                desc: 'Create separate QR codes per job or location. All reviews link to your one permanent profile.',
              },
              {
                icon: <CheckCircle className="w-5 h-5" />,
                title: 'Free forever for workers',
                desc: "If you're a service worker, TipTop is free. Full stop. We monetize on the employer side.",
              },
            ].map((feat, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-500/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 flex items-center justify-center flex-shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{feat.title}</h3>
                  <p className="text-ink-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-4xl md:text-5xl text-white mb-6">
            Start building your
            <br />
            <em className="text-brand-400">permanent reputation</em>
          </h2>
          <p className="text-ink-400 mb-8">Free for service workers. Takes 2 minutes to set up.</p>
          <Link href="/signup"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-10 py-5 rounded-2xl text-lg font-semibold transition-all active:scale-95 shadow-glow-teal">
            Create your free profile
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-xl text-brand-400">TipTop</span>
          <p className="text-ink-500 text-sm">© 2026 TipTop.review — Your reputation travels with you.</p>
          <div className="flex gap-6 text-sm text-ink-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
