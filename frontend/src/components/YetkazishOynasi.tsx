import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, LocateFixed, Loader2, Check, Copy, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLanguage'
import type { CartItem } from '@/hooks/useCart'
import { joylashuvOl } from '@/lib/geo'
import {
  yetkazishNarx, yetkazishBuyurtma, yetkazishChek, som,
  type NarxJavob, type TolovUsuli, type Yetkazish,
} from '@/lib/yetkazish'

const ManzilXaritasi = lazy(() => import('@/components/ManzilXaritasi'))

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-base sm:text-sm outline-none focus:ring-2 focus:ring-brand/30'

/**
 * Savatchadagi bitta dorixonaning mahsulotlarini yetkazib berishga buyurtma qilish.
 * Narx va yetkazish mumkinligi serverda hisoblanadi (dorixona sozlamasi: radius, narx, eng kam summa).
 */
export function YetkazishOynasi({ open, onClose, dorixona, items, onBuyurtmaQilindi }: {
  open: boolean
  onClose: () => void
  dorixona: { id: number; name: string; latitude: number | null; longitude: number | null }
  items: CartItem[]
  onBuyurtmaQilindi: () => void
}) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const navigate = useNavigate()
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [manzil, setManzil] = useState('')
  const [izoh, setIzoh] = useState('')
  const [usul, setUsul] = useState<TolovUsuli>('NAQD')
  const [narx, setNarx] = useState<NarxJavob | null>(null)
  const [aniqlanmoqda, setAniqlanmoqda] = useState(false)
  const [yuborilmoqda, setYuborilmoqda] = useState(false)
  const [xato, setXato] = useState('')
  const [natija, setNatija] = useState<Yetkazish | null>(null)
  const [chekHolati, setChekHolati] = useState('')

  // Savatchadagi taxminiy dori summasi (aniq summani server bazadagi narxdan hisoblaydi).
  const summa = useMemo(() => items.reduce((s, it) => {
    const birlik = it.tur === 'pachka' && it.pachkaNarx > 0 ? it.pachkaNarx : it.price
    return s + (birlik || 0) * (it.soni || 1)
  }, 0), [items])

  useEffect(() => {
    if (!open) return
    const c = new AbortController()
    const t = setTimeout(() => {
      yetkazishNarx(dorixona.id, lat, lon, summa, c.signal)
        .then((n) => {
          setNarx(n)
          const u = n.tolovUsullari || []
          if (u.length && !u.includes(usul)) setUsul(u[0])
        })
        .catch(() => {})
    }, 250)
    return () => { clearTimeout(t); c.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dorixona.id, lat, lon, summa])

  const joyimniTop = async () => {
    setAniqlanmoqda(true)
    setXato('')
    const n = await joylashuvOl()
    setAniqlanmoqda(false)
    if ('loc' in n) { setLat(n.loc.lat); setLon(n.loc.lon) }
    else setXato(L("Joylashuvni aniqlab bo'lmadi — xaritada uyingizni bosib belgilang", 'Не удалось определить местоположение — отметьте дом на карте'))
  }

  const yubor = async () => {
    setXato('')
    if (!localStorage.getItem('token')) { onClose(); navigate('/login'); return }
    if (lat == null || lon == null) { setXato(L('Manzilni xaritada belgilang', 'Отметьте адрес на карте')); return }
    if (manzil.trim().length < 5) { setXato(L("Manzilni to'liq yozing: ko'cha, uy, xonadon", 'Укажите полный адрес: улица, дом, квартира')); return }
    setYuborilmoqda(true)
    try {
      const y = await yetkazishBuyurtma({
        dorixonaId: dorixona.id,
        qatorlar: items.map((it) => ({ doriId: it.id, soni: it.soni || 1, tur: it.tur || 'dona' })),
        manzil: manzil.trim(), izoh: izoh.trim(), latitude: lat, longitude: lon, tolovUsuli: usul,
      })
      setNatija(y)
      onBuyurtmaQilindi()
    } catch (e) {
      setXato((e as Error).message)
    } finally {
      setYuborilmoqda(false)
    }
  }

  const chekYukla = async (f: File | undefined) => {
    if (!f || !natija) return
    setChekHolati(L('Yuklanmoqda...', 'Загрузка...'))
    try {
      setNatija(await yetkazishChek(natija.id, f))
      setChekHolati(L("Chek yuborildi — dorixona tekshirib tasdiqlaydi", 'Чек отправлен — аптека проверит'))
    } catch (e) {
      setChekHolati((e as Error).message)
    }
  }

  const yop = () => {
    setNatija(null); setXato(''); setChekHolati('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && yop()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand" /> {L('Yetkazib berish', 'Доставка')}
          </DialogTitle>
        </DialogHeader>

        {natija ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-green-300 bg-green-50 p-4">
              <p className="font-bold text-green-700 flex items-center gap-1.5"><Check className="w-4 h-4" /> {L('Buyurtma yuborildi!', 'Заказ отправлен!')}</p>
              <p className="mt-1">{L('Buyurtma raqami', 'Номер заказа')}: <b>№{natija.id}</b> · {L('kod', 'код')} <b>{natija.kod}</b></p>
              <p className="mt-1 text-ink-dim">
                {L(`${natija.dorixona_nomi} javobini kuting — qabul qilsa Telegram'dagi @dori_UzBot orqali xabar keladi.`,
                  `Ждите ответа ${natija.dorixona_nomi} — сообщение придёт в Telegram от @dori_UzBot.`)}
              </p>
              <p className="mt-2">{L('Jami', 'Итого')}: <b>{som(natija.jami)} {L("so'm", 'сум')}</b>
                {' '}({L('dori', 'лекарства')} {som(natija.dori_summa)} + {L('yetkazish', 'доставка')} {som(natija.yetkazish_narxi)})</p>
            </div>
            {natija.tolov_usuli === 'KARTA' && (
              <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 space-y-2">
                <p className="font-bold">{L("Oldindan to'lov", 'Предоплата')}</p>
                <p>{L(`${som(natija.jami)} so'mni dorixona kartasiga o'tkazing:`, `Переведите ${som(natija.jami)} сум на карту аптеки:`)}</p>
                {natija.kartaRaqami && (
                  <button type="button" onClick={() => navigator.clipboard?.writeText(natija.kartaRaqami!.replace(/\s/g, ''))}
                    className="flex items-center gap-2 font-mono text-lg font-bold tracking-wider">
                    {natija.kartaRaqami} <Copy className="w-4 h-4 text-ink-faint" />
                  </button>
                )}
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold cursor-pointer">
                  <Upload className="w-4 h-4" /> {L('Chek rasmini yuborish', 'Отправить фото чека')}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => chekYukla(e.target.files?.[0])} />
                </label>
                {chekHolati && <p className="text-ink-dim">{chekHolati}</p>}
              </div>
            )}
            <Button className="w-full" variant="secondary" onClick={() => { yop(); navigate('/profil') }}>
              {L('Buyurtmalarimni ko\'rish', 'Мои заказы')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-ink-dim">
              <b className="text-ink">{dorixona.name}</b> · {items.length} {L('xil mahsulot', 'товаров')} · {som(summa)} {L("so'm", 'сум')}
            </p>

            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{L('Manzilni xaritada belgilang', 'Отметьте адрес на карте')}</span>
              <Button type="button" size="sm" variant="secondary" onClick={joyimniTop} disabled={aniqlanmoqda}>
                {aniqlanmoqda ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />} {L('Joylashuvim', 'Моё место')}
              </Button>
            </div>
            <Suspense fallback={<div className="h-[220px] rounded-xl bg-slate-100 animate-pulse" />}>
              <ManzilXaritasi lat={lat} lon={lon} dorixona={dorixona} onChange={(a, b) => { setLat(a); setLon(b) }} />
            </Suspense>

            <input className={inputCls} value={manzil} onChange={(e) => setManzil(e.target.value)} maxLength={500}
              placeholder={L("Manzil: ko'cha, uy, xonadon", 'Адрес: улица, дом, квартира')} />
            <input className={inputCls} value={izoh} onChange={(e) => setIzoh(e.target.value)} maxLength={500}
              placeholder={L('Izoh: podyezd, qavat, mo\'ljal (ixtiyoriy)', 'Комментарий: подъезд, этаж, ориентир (необязательно)')} />

            {narx && (narx.tolovUsullari?.length ?? 0) > 0 && (
              <div className="space-y-1.5">
                <p className="font-semibold">{L("To'lov", 'Оплата')}</p>
                {narx.tolovUsullari!.includes('NAQD') && (
                  <label className="flex items-center gap-2"><input type="radio" checked={usul === 'NAQD'} onChange={() => setUsul('NAQD')} />
                    {L('Yetkazilganda to\'layman (naqd yoki karta)', 'Оплачу при получении (наличные или карта)')}</label>
                )}
                {narx.tolovUsullari!.includes('KARTA') && (
                  <label className="flex items-center gap-2"><input type="radio" checked={usul === 'KARTA'} onChange={() => setUsul('KARTA')} />
                    {L("Oldindan dorixona kartasiga o'tkazaman", 'Переведу заранее на карту аптеки')}</label>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {!narx ? (
                <p className="text-ink-dim">{L('Hisoblanmoqda...', 'Считаем...')}</p>
              ) : narx.mumkin ? (
                <div className="space-y-0.5">
                  <p className="flex justify-between"><span>{L('Dorilar', 'Лекарства')}</span><span>{som(summa)} {L("so'm", 'сум')}</span></p>
                  <p className="flex justify-between"><span>{L('Yetkazish', 'Доставка')} {narx.masofaKm != null && `(~${narx.masofaKm} km)`}</span>
                    <span>{narx.narx ? `${som(narx.narx)} ${L("so'm", 'сум')}` : L('bepul', 'бесплатно')}</span></p>
                  <p className="flex justify-between font-bold text-base pt-1 border-t border-slate-200 mt-1">
                    <span>{L('Jami', 'Итого')}</span><span>{som(narx.jami)} {L("so'm", 'сум')}</span></p>
                </div>
              ) : (
                <p className="text-amber-700">{narx.sabab}</p>
              )}
            </div>

            <p className="text-xs text-ink-faint">
              {L("Dorini dorixonaning o'zi yetkazadi. Retsept bilan beriladigan dorilar qonunga ko'ra yetkazilmaydi — ularni bron qilib, asl retsept bilan dorixonadan olasiz.",
                'Доставляет сама аптека. Рецептурные препараты по закону не доставляются — забронируйте их и заберите в аптеке по оригиналу рецепта.')}
            </p>
            {xato && <p className="text-red-600 font-semibold">{xato}</p>}
            <Button variant="success" className="w-full" onClick={yubor} disabled={yuborilmoqda || !narx?.mumkin}>
              {yuborilmoqda ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              {L('Buyurtma berish', 'Оформить заказ')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
