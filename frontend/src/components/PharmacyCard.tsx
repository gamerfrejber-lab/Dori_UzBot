import { MapPin, Building2 } from 'lucide-react'
import { useLang } from '@/hooks/useLanguage'
import { dorixonaOchiqmi, formatDistance } from '@/lib/geo'
import type { Dorixona } from '@/lib/api'

interface Props {
  pharmacy: Dorixona & { _km?: number | null }
  onClick?: () => void
}

export function PharmacyCard({ pharmacy, onClick }: Props) {
  const { lang, t } = useLang()
  const isOpen = dorixonaOchiqmi(pharmacy.ishBoshlanishi, pharmacy.ishTugashi)
  const b = pharmacy.ishBoshlanishi
  const tug = pharmacy.ishTugashi

  const statusText = !b || !tug
    ? t('ochiq')
    : isOpen
      ? `${t('ochiq')} · ${b}–${tug}`
      : `${t('yopiq')} · ${b}–${tug}`

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-[22px] p-4 shadow-[0_10px_30px_rgba(2,32,71,0.05)] flex gap-3 items-start cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(2,32,71,0.10)]"
    >
      <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-brand-sea to-brand flex items-center justify-center flex-shrink-0">
        <Building2 className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-ink text-base">{pharmacy.nomi || pharmacy.name}</div>
        <div className="text-ink-dim text-sm mt-0.5 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {pharmacy.manzil || pharmacy.address || '—'}
        </div>
        {pharmacy._km != null && (
          <div className="text-ink-dim text-sm mt-0.5">
            {formatDistance(pharmacy._km, lang)}
          </div>
        )}
        <div
          className={`text-sm font-semibold mt-1 ${isOpen ? 'text-green-600' : 'text-red-500'}`}
        >
          {statusText}
        </div>
      </div>
    </div>
  )
}
