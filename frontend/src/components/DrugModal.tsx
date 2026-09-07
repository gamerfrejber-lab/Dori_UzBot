import { useState } from 'react'
import { Pill, MapPin, Phone, Building2, Package, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLanguage'
import { useCart, type CartItem } from '@/hooks/useCart'
import { doriNominiTozalash, doriDozasi, doriTavsifi } from '@/lib/cyrillic'
import { formatDistance } from '@/lib/geo'
import { bronQilish, type DoriQidiruvResult } from '@/lib/api'

interface Props {
  drug: DoriQidiruvResult | null
  open: boolean
  onClose: () => void
}

export function DrugModal({ drug, open, onClose }: Props) {
  const { lang, t } = useLang()
  const cart = useCart()
  const [bronMode, setBronMode] = useState<'dona' | 'pachka' | null>(null)
  const [soni, setSoni] = useState(1)
  const [bronResult, setBronResult] = useState<{ ok: boolean; kod?: string; xato?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  if (!drug) return null

  const rawName = drug.name || drug.nomi || drug.nameRu || drug.nomi_ru || ''
  const name = doriNominiTozalash(rawName, lang)
  const dozasi = doriDozasi(drug.nameRu || drug.name || '', lang)
  const tavsif = doriTavsifi(rawName, lang)
  const ph = drug.dorixona
  const price = (drug.price || drug.narx || 0).toLocaleString()
  const pachka = drug.pachkaNarx || 0
  const canBron = drug.hisobYuritiladi ? (drug.qoldiq || 0) > 0 : drug.available !== false

  const handleBron = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setBronResult({ ok: false, xato: lang === 'uz' ? "Avval tizimga kiring." : 'Сначала войдите.' })
      return
    }
    if (soni <= 0) return
    setLoading(true)
    try {
      const data = await bronQilish(drug.id, soni, bronMode || 'dona', token)
      setBronResult({ ok: true, kod: data.kod })
    } catch (e) {
      setBronResult({ ok: false, xato: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    const item: CartItem = {
      id: drug.id,
      name: drug.name || drug.nomi || '',
      nameRu: drug.nameRu || drug.nomi_ru || null,
      price: drug.price || drug.narx || 0,
      pachkaNarx: drug.pachkaNarx || 0,
      manufacturer: drug.manufacturer || drug.ishlab_chiqaruvchi || '',
      dorixona: ph ? { id: ph.id, name: ph.nomi || ph.name || '' } : null,
      soni: 1,
      tur: 'dona',
    }
    cart.add(item)
    onClose()
  }

  const handleClose = () => {
    setBronMode(null)
    setBronResult(null)
    setSoni(1)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-6 h-6 text-brand" />
            {name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-4 text-sm">
          {tavsif && (
            <InfoRow label={t('tavsifi')} value={<span className="text-brand font-medium">{tavsif}</span>} />
          )}
          {dozasi && (
            <InfoRow label={t('shakliDozasi')} value={dozasi} />
          )}
          <InfoRow label={t('ishlab')} value={drug.manufacturer || drug.ishlab_chiqaruvchi || '—'} />
          <InfoRow
            label={t('donaNarx')}
            value={<span className="font-bold">{price} {t('som')}</span>}
          />
          {pachka > 0 && (
            <InfoRow
              label={t('pachka')}
              value={<span className="font-bold">{pachka.toLocaleString()} {t('som')}</span>}
              icon={<Package className="w-4 h-4" />}
            />
          )}

          <InfoRow label={t('holat')} value={<OmborStatus drug={drug} />} />

          {ph && (
            <>
              <InfoRow
                label={t('dorixonaLabel')}
                value={ph.nomi || ph.name}
                icon={<Building2 className="w-4 h-4" />}
              />
              <InfoRow
                label={t('manzil')}
                value={ph.manzil || ph.address}
                icon={<MapPin className="w-4 h-4" />}
              />
              <InfoRow
                label={t('telefon')}
                value={ph.telefon}
                icon={<Phone className="w-4 h-4" />}
              />
              {drug._km != null && (
                <InfoRow label={t('masofa')} value={formatDistance(drug._km, lang)} />
              )}

              {ph.latitude && ph.longitude && (
                <Button
                  className="w-full mt-3"
                  onClick={() =>
                    window.open(
                      `https://yandex.com/maps/?pt=${ph.longitude},${ph.latitude}&z=17&l=map`,
                      '_blank'
                    )
                  }
                >
                  <MapPin className="w-4 h-4" />
                  {t('xaritadaKorish')}
                </Button>
              )}
            </>
          )}
        </div>

        {canBron && !bronResult && !bronMode && (
          <div className="flex gap-2 mt-4">
            {pachka > 0 ? (
              <>
                <Button variant="success" className="flex-1" onClick={() => setBronMode('dona')}>
                  <Pill className="w-4 h-4" /> {t('donaBand')}
                </Button>
                <Button className="flex-1" onClick={() => setBronMode('pachka')}>
                  <Package className="w-4 h-4" /> {t('pachkaBand')}
                </Button>
              </>
            ) : (
              <Button variant="success" className="flex-1" onClick={() => setBronMode('dona')}>
                {t('bandQilish')}
              </Button>
            )}
          </div>
        )}

        {bronMode && !bronResult && (
          <div className="mt-4 p-4 rounded-2xl bg-brand/5 border border-brand/20">
            <p className="font-bold mb-2">
              {t('nechta')} {bronMode === 'pachka' ? (lang === 'uz' ? 'pachka' : 'упак.') : t('ta')}?
            </p>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                min={1}
                value={soni}
                onChange={(e) => setSoni(parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 rounded-xl border border-brand/20 bg-white text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-brand/30"
              />
              <Button variant="success" className="flex-1" onClick={handleBron} disabled={loading}>
                <Check className="w-4 h-4" />
                {loading ? '...' : t('tasdiqlash')}
              </Button>
            </div>
          </div>
        )}

        {bronResult && (
          <div
            className={`mt-4 p-4 rounded-2xl border ${
              bronResult.ok
                ? 'bg-green-50 border-green-400'
                : 'bg-red-50 border-red-300'
            }`}
          >
            {bronResult.ok ? (
              <>
                <p className="font-bold text-green-700 mb-1">
                  <Check className="w-4 h-4 inline" /> {t('bandQilindi')}
                </p>
                <p>
                  {t('olibKetishKodi')}:{' '}
                  <span className="text-2xl font-bold text-green-600">{bronResult.kod}</span>
                </p>
                <p className="text-sm text-ink-dim mt-2">{t('bronInfo')}</p>
              </>
            ) : (
              <p className="text-red-600 font-semibold">{bronResult.xato}</p>
            )}
          </div>
        )}

        <Button variant="secondary" className="w-full mt-3" onClick={handleAddToCart}>
          {t('savatchagaQosh')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <p className="flex items-start gap-1.5">
      <span className="text-ink-dim">{label}</span>
      {icon && <span className="text-ink-faint mt-0.5">{icon}</span>}
      <span className="text-ink">{value}</span>
    </p>
  )
}

function OmborStatus({ drug }: { drug: DoriQidiruvResult }) {
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
