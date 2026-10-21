import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useLang } from '@/hooks/useLanguage'
import { categories } from '@/lib/categories'
import { categoryIcons, defaultCategoryIcon } from '@/lib/categoryIcons'

interface Props {
  open: boolean
  onClose: () => void
}

export function CategorySidebar({ open, onClose }: Props) {
  const { lang } = useLang()
  const navigate = useNavigate()

  // Panel ochiq paytda orqadagi sahifa aylanmasin (aks holda ro'yxat oxiriga yetganda sahifa ham siljiydi
  // va ikkalasi birga chizilib, aylantirish notekis bo'ladi). Escape — yopish.
  useEffect(() => {
    if (!open) return
    const avvalgi = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const tugma = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', tugma)
    return () => {
      document.body.style.overflow = avvalgi
      window.removeEventListener('keydown', tugma)
    }
  }, [open, onClose])

  const handleClick = (slug: string) => {
    onClose()
    navigate(`/kategoriya/${slug}`)
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-[60] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        aria-hidden={!open}
        className={`fixed top-0 left-0 h-full w-[300px] max-w-[85vw] bg-white z-[70] pt-[var(--app-top-inset)] shadow-2xl flex flex-col [contain:layout_paint] transition-[transform,visibility] duration-300 ease-out ${
          open ? 'translate-x-0 visible' : '-translate-x-full invisible'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-extrabold text-ink">
            {lang === 'uz' ? 'Kategoriyalar' : 'Категории'}
          </h2>
          <button
            onClick={onClose}
            aria-label={lang === 'uz' ? 'Yopish' : 'Закрыть'}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-ink-dim" />
          </button>
        </div>

        {/* Ro'yxat o'z ichida aylanadi: oxiriga yetganda aylantirish sahifaga o'tib ketmaydi (overscroll-contain). */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.iconName] || defaultCategoryIcon
            return (
              <button
                key={cat.slug}
                onClick={() => handleClick(cat.slug)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-ink text-sm">
                  {lang === 'uz' ? cat.uz : cat.ru}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
