import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Building2, ShoppingCart, User } from 'lucide-react'
import { useLang } from '@/hooks/useLanguage'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const { t } = useLang()
  const { count, toggle } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const isActive = (path: string) =>
    location.pathname === path || (path === '/' && location.pathname === '/index.html')

  const items = [
    { path: '/', icon: Home, label: t('boshSahifa') },
    { path: '/dorixonalar', icon: Building2, label: t('dorixonalar') },
    { path: '__cart__', icon: ShoppingCart, label: t('savatcha') },
    { path: token ? '/profil' : '/login', icon: User, label: token ? t('profil') : t('kirish') },
  ]

  const handleClick = (path: string, e: React.MouseEvent) => {
    if (!token && path !== '/login') {
      e.preventDefault()
      navigate('/login')
    }
  }

  const handleCartClick = () => {
    if (!token) {
      navigate('/login')
      return
    }
    toggle()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-stretch justify-around h-[60px]">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.path !== '__cart__' && isActive(item.path)
          const isCart = item.path === '__cart__'

          if (isCart) {
            return (
              <button
                key="cart"
                onClick={handleCartClick}
                className="flex flex-col items-center justify-center flex-1 relative transition-colors text-ink-dim active:text-brand"
              >
                <div className="relative">
                  <Icon className="w-[22px] h-[22px]" />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-brand-ember text-white text-[0.6rem] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-0.5">
                      {count}
                    </span>
                  )}
                </div>
                <span className="text-[0.65rem] font-semibold mt-0.5">{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.path}
              to={token ? item.path : '/login'}
              onClick={(e) => handleClick(item.path, e)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 no-underline transition-colors',
                active ? 'text-brand' : 'text-ink-dim active:text-brand'
              )}
            >
              <div className="relative">
                {active && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-brand" />
                )}
                <Icon className={cn('w-[22px] h-[22px]', active && 'stroke-[2.5px]')} />
              </div>
              <span className={cn('text-[0.65rem] mt-0.5', active ? 'font-bold' : 'font-semibold')}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
