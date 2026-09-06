import { Pill } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { doriNomi, doriShakli, cyrToLat } from '@/lib/cyrillic'
import { useLang } from '@/hooks/useLanguage'
import type { DoriQidiruvResult, DoriKatalog } from '@/lib/api'
import { formatDistance } from '@/lib/geo'

interface DrugResultCardProps {
  drug: DoriQidiruvResult
  onClick: () => void
}

export function DrugResultCard({ drug, onClick }: DrugResultCardProps) {
  const { lang, t } = useLang()
  const name = doriNomi(drug.nomi || drug.name || '', drug.nomi_ru || drug.nameRu || null, lang)
  const price = (drug.narx || drug.price || 0).toLocaleString()
  const pachka = drug.pachkaNarx || 0
  const ph = drug.dorixona

  return (
    <Card
      className="p-5 cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_18px_40px_rgba(2,32,71,0.10)]"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
          <Pill className="w-5 h-5 text-brand" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-ink text-base leading-tight">{name}</h3>
          <p className="text-sm text-ink-dim mt-0.5">
            {drug.ishlab_chiqaruvchi || drug.manufacturer || '—'}
          </p>
        </div>
      </div>

      <div className="space-y-1 text-sm">
        <p>
          <span className="text-ink-dim">{t('donaNarx')}</span>{' '}
          <span className="font-semibold text-ink">{price} {t('som')}</span>
          {pachka > 0 && (
            <>
              {' | '}
              <span className="text-ink-dim">{t('pachka')}</span>{' '}
              <span className="font-semibold">{pachka.toLocaleString()} {t('som')}</span>
            </>
          )}
        </p>

        {ph && (
          <>
            <p className="text-ink-dim">
              {t('dorixonaLabel')} <span className="text-ink font-medium">{ph.nomi || ph.name}</span>
            </p>
            <p className="text-ink-dim">
              {t('manzil')} {ph.manzil || ph.address}
            </p>
          </>
        )}

        {drug._km != null && (
          <p className="text-ink-dim">
            {t('masofa')} <span className="font-medium text-brand">{formatDistance(drug._km, lang)}</span>
          </p>
        )}

        <p>
          <span className="text-ink-dim">{t('holat')}</span>{' '}
          <OmborHolati drug={drug} />
        </p>
      </div>
    </Card>
  )
}

function OmborHolati({ drug }: { drug: DoriQidiruvResult }) {
  const { t } = useLang()
  if (!drug.hisobYuritiladi) {
    return drug.available !== false ? (
      <span className="text-green-600 font-semibold">{t('mavjud')}</span>
    ) : (
      <span className="text-red-500 font-semibold">{t('mavjudEmas')}</span>
    )
  }
  const qoldiq = drug.qoldiq || 0
  if (qoldiq <= 0) return <span className="text-red-500 font-semibold">{t('tugagan')}</span>
  return (
    <span className="text-green-600 font-semibold">
      {t('omborda')} <b>{qoldiq}</b> {t('ta')}
    </span>
  )
}

interface CatalogCardProps {
  drug: DoriKatalog
  onClick: () => void
}

export function CatalogCard({ drug, onClick }: CatalogCardProps) {
  const { lang } = useLang()
  const katNomi = lang === 'uz' ? cyrToLat(drug.nomi || '') : drug.nomi || ''
  const firma = [drug.ishlabChiqaruvchi, drug.davlat].filter(Boolean).join(', ')
  const firmaDisplay = lang === 'uz' ? cyrToLat(firma) : firma
  const shakl = doriShakli(drug.nomi, lang)

  return (
    <Card
      className="relative p-5 cursor-pointer hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(2,32,71,0.10)]"
      onClick={onClick}
    >
      <Badge variant="warning" className="absolute top-4 right-4">
        {shakl}
      </Badge>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-3">
        <Pill className="w-7 h-7 text-brand" />
      </div>
      <h3 className="font-bold text-ink text-lg leading-tight mb-1">{katNomi}</h3>
      <p className="text-sm text-ink-dim">
        {firmaDisplay || (lang === 'uz' ? 'Katalog dorisi' : 'Из каталога')}
      </p>
    </Card>
  )
}
