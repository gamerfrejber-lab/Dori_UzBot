import { useNavigate } from 'react-router-dom'
import { X, Brain, Thermometer, Wind, Stethoscope, Heart, Droplets, Bone, Syringe, Eye, Baby, Sparkles, Apple, ShieldPlus, Pill } from 'lucide-react'
import { useLang } from '@/hooks/useLanguage'

interface Category {
  icon: React.ReactNode
  uz: string
  ru: string
  search: string
  color: string
}

const categories: Category[] = [
  { icon: <Brain className="w-5 h-5" />, uz: "Bosh og'rig'i", ru: 'Головная боль', search: 'парацетамол', color: 'bg-purple-50 text-purple-500' },
  { icon: <Thermometer className="w-5 h-5" />, uz: 'Shamollash va gripp', ru: 'Простуда и грипп', search: 'терафлю', color: 'bg-blue-50 text-blue-500' },
  { icon: <Wind className="w-5 h-5" />, uz: "Yo'tal", ru: 'Кашель', search: 'бромгексин', color: 'bg-teal-50 text-teal-500' },
  { icon: <Stethoscope className="w-5 h-5" />, uz: 'Oshqozon', ru: 'Желудок', search: 'омепразол', color: 'bg-amber-50 text-amber-500' },
  { icon: <Heart className="w-5 h-5" />, uz: 'Yurak', ru: 'Сердце', search: 'валидол', color: 'bg-red-50 text-red-500' },
  { icon: <Droplets className="w-5 h-5" />, uz: 'Qon bosim', ru: 'Давление', search: 'амлодипин', color: 'bg-rose-50 text-rose-500' },
  { icon: <ShieldPlus className="w-5 h-5" />, uz: 'Allergiya', ru: 'Аллергия', search: 'лоратадин', color: 'bg-orange-50 text-orange-500' },
  { icon: <Syringe className="w-5 h-5" />, uz: 'Antibiotiklar', ru: 'Антибиотики', search: 'амоксициллин', color: 'bg-emerald-50 text-emerald-500' },
  { icon: <Bone className="w-5 h-5" />, uz: "Bo'g'im og'rig'i", ru: 'Боль в суставах', search: 'диклофенак', color: 'bg-stone-100 text-stone-500' },
  { icon: <Pill className="w-5 h-5" />, uz: "Og'riq qoldiruvchi", ru: 'Обезболивающие', search: 'кетанов', color: 'bg-indigo-50 text-indigo-500' },
  { icon: <Eye className="w-5 h-5" />, uz: "Ko'z", ru: 'Глаза', search: 'визин', color: 'bg-cyan-50 text-cyan-500' },
  { icon: <Sparkles className="w-5 h-5" />, uz: 'Diabet', ru: 'Диабет', search: 'метформин', color: 'bg-violet-50 text-violet-500' },
  { icon: <Baby className="w-5 h-5" />, uz: 'Bolalar uchun', ru: 'Для детей', search: 'нурофен', color: 'bg-pink-50 text-pink-500' },
  { icon: <Apple className="w-5 h-5" />, uz: 'Vitaminlar', ru: 'Витамины', search: 'витамин', color: 'bg-green-50 text-green-500' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function CategorySidebar({ open, onClose }: Props) {
  const { lang } = useLang()
  const navigate = useNavigate()

  const handleClick = (search: string) => {
    onClose()
    navigate(`/?search=${encodeURIComponent(search)}`)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] transition-opacity"
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
          {categories.map((cat) => (
            <button
              key={cat.search}
              onClick={() => handleClick(cat.search)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                {cat.icon}
              </div>
              <span className="font-semibold text-ink text-sm">
                {lang === 'uz' ? cat.uz : cat.ru}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
