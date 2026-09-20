import { useNavigate } from 'react-router-dom'
import { X, Brain, Thermometer, Wind, Stethoscope, Heart, Droplets, Bone, Syringe, Eye, Baby, Sparkles, Apple, ShieldPlus, Pill } from 'lucide-react'
import { useLang } from '@/hooks/useLanguage'
import { categories } from '@/lib/categories'

const iconMap: Record<string, React.ElementType> = {
  Brain, Thermometer, Wind, Stethoscope, Heart, Droplets, Bone,
  Syringe, Eye, Baby, Sparkles, Apple, ShieldPlus, Pill,
}

interface Props {
  open: boolean
  onClose: () => void
}

export function CategorySidebar({ open, onClose }: Props) {
  const { lang } = useLang()
  const navigate = useNavigate()

  const handleClick = (slug: string) => {
    onClose()
    navigate(`/kategoriya/${slug}`)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-[300px] max-w-[85vw] bg-white z-[70] shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-ink">
            {lang === 'uz' ? 'Kategoriyalar' : 'Категории'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-ink-dim" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-65px)] py-2">
          {categories.map((cat) => {
            const Icon = iconMap[cat.iconName] || Pill
            return (
              <button
                key={cat.slug}
                onClick={() => handleClick(cat.slug)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
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
        </div>
      </div>
    </>
  )
}
