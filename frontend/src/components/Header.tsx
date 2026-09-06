import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, User, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLanguage'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils'

export function Header() {
  const { lang, setLang, t } = useLang()
  const { count, toggle } = useCart()
  const location = useLocation()
  const token = localStorage.getItem('token')

  const isActive = (path: string) =>
    location.pathname === path || (path === '/' && location.pathname === '/index.html')

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_4px_24px_rgba(2,32,71,0.06)] rounded-b-[22px]">
      <div className="max-w-[1180px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 font-extrabold text-lg text-ink no-underline">
          <div className="w-[42px] h-[42px] p-2 bg-gradient-to-br from-brand-sea to-brand rounded-[14px] shadow-[0_6px_16px_rgba(37,99,235,0.32)] flex items-center justify-center">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <span className="max-[360px]:hidden">Dori Qidiruv</span>
        </Link>

        <nav className="flex items-center gap-1">
          {/* Desktop nav links */}
          <Link
            to="/"
            className={cn(
              'hidden md:inline-flex px-3 py-1.5 rounded-full text-sm font-semibold transition-all no-underline',
              isActive('/')
                ? 'text-white bg-gradient-to-br from-brand-sea to-brand shadow-[0_6px_16px_rgba(37,99,235,0.35)]'
                : 'text-ink-dim hover:text-brand hover:bg-brand/[0.08]'
            )}
          >
            {t('boshSahifa')}
          </Link>
          <Link
            to="/dorixonalar"
            className={cn(
              'hidden md:inline-flex px-3 py-1.5 rounded-full text-sm font-semibold transition-all no-underline',
              isActive('/dorixonalar')
                ? 'text-white bg-gradient-to-br from-brand-sea to-brand shadow-[0_6px_16px_rgba(37,99,235,0.35)]'
                : 'text-ink-dim hover:text-brand hover:bg-brand/[0.08]'
            )}
          >
            {t('dorixonalar')}
          </Link>

          {/* Desktop cart */}
          <button
            onClick={toggle}
            className="hidden md:flex relative p-2 rounded-full hover:bg-brand/[0.08] transition-colors"
            title={t('savatcha')}
          >
            <ShoppingCart className="w-5 h-5 text-ink-dim" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-1 bg-brand-ember text-white text-[0.68rem] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                {count}
              </span>
            )}
          </button>

          <div className="flex gap-0.5 bg-slate-100 rounded-full p-0.5">
            <button
              onClick={() => setLang('uz')}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-bold transition-all',
                lang === 'uz'
                  ? 'text-white bg-gradient-to-br from-brand-sea to-brand shadow-[0_4px_12px_rgba(37,99,235,0.35)]'
                  : 'text-ink-faint hover:text-ink-dim'
              )}
            >
              UZ
            </button>
            <button
              onClick={() => setLang('ru')}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-bold transition-all',
                lang === 'ru'
                  ? 'text-white bg-gradient-to-br from-brand-sea to-brand shadow-[0_4px_12px_rgba(37,99,235,0.35)]'
                  : 'text-ink-faint hover:text-ink-dim'
              )}
            >
              RU
            </button>
          </div>

          {/* Desktop profile button */}
          <Link to={token ? '/profil' : '/login'} className="hidden md:inline-flex">
            <Button size="sm">
              <User className="w-4 h-4" />
              <span>{token ? t('profil') : t('kirish')}</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
