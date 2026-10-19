import { useEffect, useLayoutEffect, useState, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Phone, Search, Navigation, Pill, Package, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { xaritaHavolasi, telHavola } from '@/lib/xarita'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLang } from '@/hooks/useLanguage'
import { useCart, type CartItem } from '@/hooks/useCart'
import * as api from '@/lib/api'
import type { Dorixona, DoriQidiruvResult } from '@/lib/api'
import { requestLocation, distanceKm, dorixonaOchiqmi, formatDistance } from '@/lib/geo'
import { doriKartaNomi, doriShakliDozasi } from '@/lib/cyrillic'
import { bronQilish } from '@/lib/api'

// Xarita kutubxonasi faqat shu sahifa ochilganda yuklanadi (bosh sahifa yengil qoladi).
const DorixonalarXaritasi = lazy(() => import('@/components/DorixonalarXaritasi'))

export function Dorixonalar() {
  const { lang, t } = useLang()

  const [pharmacies, setPharmacies] = useState<(Dorixona & { _km?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null)
  const [selected, setSelected] = useState<Dorixona | null>(null)
  const [drugs, setDrugs] = useState<DoriQidiruvResult[]>([])
  const [drugsLoading, setDrugsLoading] = useState(false)
  const [drugDetail, setDrugDetail] = useState<DoriQidiruvResult | null>(null)
  const [filterText, setFilterText] = useState('')
  const [tepa, setTepa] = useState(64)

  // Xarita sarlavha ostidan boshlansin: sarlavha balandligi qurilmaga qarab o'zgaradi.
  useLayoutEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const olch = () => setTepa(Math.round(header.getBoundingClientRect().bottom))
    olch()
    const ro = new ResizeObserver(olch)
    ro.observe(header)
    window.addEventListener('resize', olch)
    return () => { ro.disconnect(); window.removeEventListener('resize', olch) }
  }, [])

  const loadPharmacies = useCallback(async (loc?: { lat: number; lon: number } | null) => {
    try {
      const data = await api.dorixonalar()
      const withDist = data.map((ph) => ({
        ...ph,
        _km: loc && ph.latitude && ph.longitude
          ? distanceKm(loc.lat, loc.lon, ph.latitude, ph.longitude)
          : undefined,
      }))
      if (loc) withDist.sort((a, b) => (a._km ?? 999) - (b._km ?? 999))
      setPharmacies(withDist)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPharmacies()
    const autoOpen = sessionStorage.getItem('ochilsin')
    if (autoOpen) {
      sessionStorage.removeItem('ochilsin')
      const id = parseInt(autoOpen)
      if (id) {
        api.dorixonalar().then((data) => {
          const ph = data.find((p) => p.id === id)
          if (ph) openPharmacy(ph)
        })
      }
    }
  }, [loadPharmacies])

  const handleLocate = async () => {
    const loc = await requestLocation()
    if (loc) {
      setUserLoc(loc)
      loadPharmacies(loc)
    }
  }

  const openPharmacy = async (ph: Dorixona) => {
    setSelected(ph)
    setDrugsLoading(true)
    setDrugs([])
    try {
      const data = await api.dorixonaDorilar(ph.id)
      setDrugs(data)
    } catch {
      // ignore
    } finally {
      setDrugsLoading(false)
    }
  }

  const filtered = pharmacies.filter((ph) => {
    if (!filterText) return true
    const q = filterText.toLowerCase()
    const name = (ph.nomi || ph.name || '').toLowerCase()
    const addr = (ph.manzil || ph.address || '').toLowerCase()
    return name.includes(q) || addr.includes(q)
  })

  return (
    // Butun ekranli xarita (Yandex xaritadagidek): sarlavha ostidan pastki menyugacha.
    <section
      className="fixed left-0 right-0 bottom-[calc(68px+env(safe-area-inset-bottom))] md:bottom-0 z-0"
      style={{ top: tepa }}
    >
      <Suspense fallback={<div className="absolute inset-0 bg-slate-100 animate-pulse" />}>
        <DorixonalarXaritasi
          className="absolute inset-0"
          pharmacies={filtered}
          userLoc={userLoc}
          lang={lang}
          onOpen={openPharmacy}
        />
      </Suspense>

      <div className="absolute top-3 left-3 right-3 z-10 mx-auto max-w-[560px]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder={lang === 'uz' ? 'Dorixona yoki manzil qidirish...' : 'Поиск аптеки или адреса...'}
            className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-200 bg-white text-sm shadow-[0_8px_24px_rgba(15,23,42,0.15)] outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        {loading && (
          <p className="mt-2 mx-auto w-fit rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ink-dim shadow">
            {lang === 'uz' ? 'Yuklanmoqda...' : 'Загрузка...'}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleLocate}
        title={t('joylashuvAniqla')}
        aria-label={t('joylashuvAniqla')}
        className={`absolute right-3 bottom-[96px] z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(15,23,42,0.2)] border ${userLoc ? 'bg-brand text-white border-brand' : 'bg-white text-brand border-slate-200'}`}
      >
        <Navigation className="w-5 h-5" />
      </button>

      <PharmacyModal
        pharmacy={selected}
        drugs={drugs}
        drugsLoading={drugsLoading}
        userLoc={userLoc}
        onClose={() => { setSelected(null); setDrugs([]) }}
        onDrugClick={setDrugDetail}
      />

      <DrugDetailModal
        drug={drugDetail}
        onClose={() => setDrugDetail(null)}
      />
    </section>
  )
}

function PharmacyModal({
  pharmacy,
  drugs,
  drugsLoading,
  userLoc,
  onClose,
  onDrugClick,
}: {
  pharmacy: Dorixona | null
  drugs: DoriQidiruvResult[]
  drugsLoading: boolean
  userLoc: { lat: number; lon: number } | null
  onClose: () => void
  onDrugClick: (d: DoriQidiruvResult) => void
}) {
  const { lang, t } = useLang()
  if (!pharmacy) return null

  const isOpen = dorixonaOchiqmi(pharmacy.ishBoshlanishi, pharmacy.ishTugashi)
  const km = userLoc && pharmacy.latitude && pharmacy.longitude
    ? distanceKm(userLoc.lat, userLoc.lon, pharmacy.latitude, pharmacy.longitude)
    : null

  return (
    <Dialog open={!!pharmacy} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand" />
            {pharmacy.nomi || pharmacy.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-3 text-sm">
          <p className="flex items-center gap-1.5 text-ink-dim">
            <MapPin className="w-4 h-4" /> {pharmacy.manzil || pharmacy.address}
          </p>
          {pharmacy.telefon && (
            <a href={telHavola(pharmacy.telefon)} className="flex items-center gap-1.5 text-brand font-semibold">
              <Phone className="w-4 h-4" /> {pharmacy.telefon}
            </a>
          )}
          <p className={`font-semibold ${isOpen ? 'text-green-600' : 'text-red-500'}`}>
            {isOpen ? t('ochiq') : t('yopiq')}
            {pharmacy.ishBoshlanishi && pharmacy.ishTugashi && ` · ${pharmacy.ishBoshlanishi}–${pharmacy.ishTugashi}`}
          </p>
          {km != null && (
            <p className="text-brand font-semibold">{formatDistance(km, lang)}</p>
          )}
          {xaritaHavolasi(pharmacy) && (
            <Button
              className="w-full mt-2"
              onClick={() => window.open(xaritaHavolasi(pharmacy)!, '_blank')}
            >
              <MapPin className="w-4 h-4" /> {t('xaritadaKorish')}
            </Button>
          )}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="font-bold text-ink mb-3">{t('dorixonadagiDorilar')}</h3>
          {drugsLoading ? (
            <p className="text-ink-dim text-sm">{t('dorilarYuklanmoqda')}</p>
          ) : drugs.length === 0 ? (
            <p className="text-ink-dim text-sm">{t('dorilarTopilmadi')}</p>
          ) : (
            <div className="max-h-[40vh] overflow-y-auto space-y-2">
              {drugs.map((drug) => {
                const name = doriKartaNomi(drug, lang)
                const price = (drug.price || drug.narx || 0).toLocaleString()
                return (
                  <div
                    key={drug.id}
                    onClick={() => onDrugClick(drug)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-brand/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Pill className="w-4 h-4 text-brand flex-shrink-0" />
                      <span className="text-sm font-medium text-ink truncate">{name}</span>
                    </div>
                    <span className="text-sm font-bold text-brand whitespace-nowrap ml-2">
                      {price} {t('som')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DrugDetailModal({
  drug,
  onClose,
}: {
  drug: DoriQidiruvResult | null
  onClose: () => void
}) {
  const { lang, t } = useLang()
  const navigate = useNavigate()
  const cart = useCart()
  const [bronMode, setBronMode] = useState<'dona' | 'pachka' | null>(null)
  const [soni, setSoni] = useState(1)
  const [bronResult, setBronResult] = useState<{ ok: boolean; kod?: string; xato?: string; doriTugadi?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  if (!drug) return null

  const name = doriKartaNomi(drug, lang)
  const dozasi = doriShakliDozasi(drug.nameRu || drug.name || drug.nomi || '', lang)
  const price = (drug.price || drug.narx || 0).toLocaleString()
  const pachka = drug.pachkaNarx || 0
  const canBron = drug.hisobYuritiladi ? (drug.qoldiq || 0) > 0 : drug.available !== false

  // Bron faqat ro'yxatdan o'tganlarga: mehmon "Band qilish"ni bosishi bilan kirish sahifasi ochiladi.
  const bronBoshlash = (tur: 'dona' | 'pachka') => {
    if (!localStorage.getItem('token')) {
      onClose()
      navigate('/login')
      return
    }
    setBronMode(tur)
  }

  const handleBron = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      // Bron faqat ro'yxatdan o'tganlarga: mehmonni kirish sahifasiga yuboramiz.
      navigate('/login')
      return
    }
    setLoading(true)
    try {
      const data = await bronQilish(drug.id, soni, bronMode || 'dona', token)
      setBronResult({ ok: true, kod: data.kod, doriTugadi: data.doriTugadi })
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
      dorixona: drug.dorixona ? { id: drug.dorixona.id, name: drug.dorixona.nomi || drug.dorixona.name || '' } : null,
      soni: 1,
      tur: 'dona',
    }
    cart.add(item)
    handleClose()
  }

  const handleClose = () => {
    setBronMode(null)
    setBronResult(null)
    setSoni(1)
    onClose()
  }

  return (
    <Dialog open={!!drug} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="w-6 h-6 text-brand" /> {name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-4 text-sm">
          {dozasi && <InfoRow label={t('dozasi')} value={dozasi} />}
          <InfoRow label={t('ishlab')} value={drug.manufacturer || drug.ishlab_chiqaruvchi || '—'} />
          <InfoRow label={t('donaNarx')} value={<span className="font-bold">{price} {t('som')}</span>} />
          {pachka > 0 && (
            <InfoRow label={t('pachka')} value={<span className="font-bold">{pachka.toLocaleString()} {t('som')}</span>} />
          )}
        </div>

        {canBron && !bronResult && !bronMode && (
          <div className="flex gap-2 mt-4">
            {pachka > 0 ? (
              <>
                <Button variant="success" className="flex-1" onClick={() => bronBoshlash('dona')}>
                  <Pill className="w-4 h-4" /> {t('donaBand')}
                </Button>
                <Button className="flex-1" onClick={() => bronBoshlash('pachka')}>
                  <Package className="w-4 h-4" /> {t('pachkaBand')}
                </Button>
              </>
            ) : (
              <Button variant="success" className="flex-1" onClick={() => bronBoshlash('dona')}>
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
          <div className={`mt-4 p-4 rounded-2xl border ${bronResult.ok ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-300'}`}>
            {bronResult.ok ? (
              <>
                <p className="font-bold text-green-700 mb-1"><Check className="w-4 h-4 inline" /> {t('bandQilindi')}</p>
                <p>{t('olibKetishKodi')}: <span className="text-2xl font-bold text-green-600">{bronResult.kod}</span></p>
                <p className="text-sm text-ink-dim mt-2">{t('bronInfo')}</p>
                {bronResult.doriTugadi && (
                  <p className="text-sm text-orange-600 font-semibold mt-2">
                    {lang === 'uz' ? "⚠ Bu dori tugadi — dorixona adminiga xabar yuborildi." : '⚠ Лекарство закончилось — уведомление отправлено аптеке.'}
                  </p>
                )}
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5">
      <span className="text-ink-dim">{label}</span>
      <span className="text-ink">{value}</span>
    </p>
  )
}
