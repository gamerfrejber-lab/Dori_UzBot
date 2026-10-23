import { useCallback, useEffect, useState } from 'react'
import { Truck, Check, X, MapPin, Phone, Receipt, Save, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLanguage'
import { telHavola } from '@/lib/xarita'
import {
  HOLAT_NOMI, chekHavolasi, dxSozlama, dxSozlamaYoz, dxTolovTasdiqla, dxYetkazishHolat, dxYetkazishlar, som,
  type Yetkazish, type YetkazishSozlama,
} from '@/lib/yetkazish'

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30'

/**
 * Dorixona panelidagi "Yetkazish": kelgan buyurtmalar (qabul / yo'lda / yetkazildi / bekor, kartaga to'lov cheki)
 * va yetkazish sozlamalari. Botdagi "🚚 Yetkazish" bilan bir xil — bu yerda o'zgartirilgani botda ham ko'rinadi.
 */
export function YetkazishBoshqaruv() {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [royxat, setRoyxat] = useState<Yetkazish[] | null>(null)
  const [xabar, setXabar] = useState<Record<number, string>>({})

  const yukla = useCallback(() => { dxYetkazishlar().then(setRoyxat).catch(() => setRoyxat([])) }, [])
  useEffect(() => {
    yukla()
    const t = setInterval(yukla, 30_000) // yangi buyurtma kelsa 30 soniyada ko'rinadi
    return () => clearInterval(t)
  }, [yukla])

  const bajar = async (id: number, ish: () => Promise<Yetkazish & { ogohlantirish?: string }>) => {
    try {
      const y = await ish()
      setRoyxat((r) => (r || []).map((x) => (x.id === y.id ? y : x)))
      setXabar((m) => ({ ...m, [id]: y.ogohlantirish || '' }))
    } catch (e) {
      setXabar((m) => ({ ...m, [id]: (e as Error).message }))
    }
  }

  const qabul = (y: Yetkazish) => {
    const d = prompt(L('Necha daqiqada yetkazasiz?', 'Через сколько минут доставите?'), '40')
    if (d === null) return
    bajar(y.id, () => dxYetkazishHolat(y.id, { holat: 'QABUL', daqiqa: parseInt(d) || undefined }))
  }
  const yolda = (y: Yetkazish) => {
    const t = prompt(L('Kuryer telefoni (mijozga ko\'rsatiladi, ixtiyoriy)', 'Телефон курьера (увидит клиент, необязательно)'), '')
    if (t === null) return
    bajar(y.id, () => dxYetkazishHolat(y.id, { holat: 'YOLDA', kuryerTelefon: t || undefined }))
  }
  const bekor = (y: Yetkazish) => {
    const s = prompt(L('Bekor qilish sababi (mijozga yuboriladi)', 'Причина отмены (будет отправлена клиенту)'), L("Dori tugagan", 'Нет в наличии'))
    if (s === null) return
    bajar(y.id, () => dxYetkazishHolat(y.id, { holat: 'BEKOR', sabab: s }))
  }
  const chekniKor = async (y: Yetkazish) => {
    const url = await chekHavolasi(`/api/dorixonachi/yetkazish/${y.id}/chek`)
    if (url) window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-ink flex items-center gap-2"><Truck className="w-5 h-5 text-brand" /> {L('Buyurtmalar', 'Заказы')}</h3>
          <Button size="sm" variant="secondary" onClick={yukla}><RefreshCw className="w-4 h-4" /> {L('Yangilash', 'Обновить')}</Button>
        </div>
        {royxat === null ? (
          <p className="text-sm text-ink-dim">{L('Yuklanmoqda...', 'Загрузка...')}</p>
        ) : royxat.length === 0 ? (
          <p className="text-sm text-ink-dim">{L("Hozircha yetkazish buyurtmasi yo'q. Pastda yetkazishni yoqing.", 'Заказов на доставку пока нет. Включите доставку ниже.')}</p>
        ) : (
          <div className="space-y-3">
            {royxat.map((y) => {
              const h = HOLAT_NOMI[y.holat]
              const faol = y.holat === 'YANGI' || y.holat === 'QABUL' || y.holat === 'YOLDA'
              return (
                <div key={y.id} className={`rounded-2xl border p-3 sm:p-4 text-sm space-y-1.5 ${y.holat === 'YANGI' ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-ink">№{y.id} · {new Date(y.sana).toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${h.rang}`}>{lang === 'ru' ? h.ru : h.uz}</span>
                  </div>
                  <ul className="list-disc pl-5 text-ink">
                    {y.qatorlar.map((q, i) => <li key={i}>{q.nomi} — {q.soni} {q.tur === 'pachka' ? L('pachka', 'уп.') : L('ta', 'шт.')} × {som(q.narx)}</li>)}
                  </ul>
                  <div>{L('Dorilar', 'Лекарства')} {som(y.dori_summa)} + {L('yetkazish', 'доставка')} {som(y.yetkazish_narxi)} = <b>{som(y.jami)} {L("so'm", 'сум')}</b>
                    {' '}· {y.tolov_usuli === 'KARTA' ? L('kartaga oldindan', 'предоплата') : L('yetkazilganda', 'при получении')}</div>
                  <div className="flex items-start gap-1.5"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-ink-faint" />
                    <span>{y.manzil}{y.izoh ? ` (${y.izoh})` : ''}{y.masofa_km != null ? ` · ~${y.masofa_km} km` : ''}
                      {y.latitude != null && y.longitude != null && (
                        <a className="ml-2 font-semibold text-brand" target="_blank" rel="noreferrer"
                          href={`https://yandex.uz/maps/?pt=${y.longitude},${y.latitude}&z=17&l=map`}>{L('Xaritada', 'На карте')}</a>
                      )}</span>
                  </div>
                  {y.mijoz_telefon && (
                    <a href={telHavola(y.mijoz_telefon)} className="inline-flex items-center gap-1.5 font-semibold text-brand">
                      <Phone className="w-4 h-4" /> {y.mijoz_ismi || L('Mijoz', 'Клиент')}: {y.mijoz_telefon}
                    </a>
                  )}
                  {y.tolov_usuli === 'KARTA' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-ink-dim">{y.tolov_holati === 'TASDIQLANDI' ? L("To'lov tasdiqlangan", 'Оплата подтверждена')
                        : y.tolov_holati === 'CHEK_YUBORILDI' ? L('Chek keldi — tekshiring', 'Пришёл чек — проверьте') : L("To'lov kutilmoqda", 'Ожидается оплата')}</span>
                      {y.chek_bor && <Button size="sm" variant="secondary" onClick={() => chekniKor(y)}><Receipt className="w-4 h-4" /> {L('Chekni ko\'rish', 'Чек')}</Button>}
                      {y.tolov_holati === 'CHEK_YUBORILDI' && (
                        <Button size="sm" variant="success" onClick={() => bajar(y.id, () => dxTolovTasdiqla(y.id))}><Check className="w-4 h-4" /> {L("To'lov keldi", 'Оплата получена')}</Button>
                      )}
                    </div>
                  )}
                  {y.holat === 'YOLDA' && y.kuryer_telefon && <div className="text-ink-dim">{L('Kuryer', 'Курьер')}: {y.kuryer_telefon}</div>}
                  {y.holat === 'BEKOR' && y.bekor_sababi && <div className="text-red-600">{y.bekor_sababi}</div>}
                  {faol && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {y.holat === 'YANGI' && <Button size="sm" variant="success" onClick={() => qabul(y)}><Check className="w-4 h-4" /> {L('Qabul qilish', 'Принять')}</Button>}
                      {y.holat === 'QABUL' && <Button size="sm" onClick={() => yolda(y)}><Truck className="w-4 h-4" /> {L("Yo'lga chiqdi", 'Курьер выехал')}</Button>}
                      {(y.holat === 'QABUL' || y.holat === 'YOLDA') && (
                        <Button size="sm" variant="success" onClick={() => bajar(y.id, () => dxYetkazishHolat(y.id, { holat: 'YETKAZILDI' }))}>
                          <Check className="w-4 h-4" /> {L('Yetkazildi', 'Доставлен')}</Button>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => bekor(y)}><X className="w-4 h-4" /> {y.holat === 'YANGI' ? L('Rad etish', 'Отклонить') : L('Bekor qilish', 'Отменить')}</Button>
                    </div>
                  )}
                  {xabar[y.id] && <p className="text-amber-700">{xabar[y.id]}</p>}
                </div>
              )
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-ink-faint">
          {L("Kuryerni Yandex Go ilovasidagi \"Yetkazish\" bo'limidan chaqiring: olish joyi — dorixona, topshirish — mijoz manzili. Kuryer haqini dorixona to'laydi va mijozdan yetkazish narxi sifatida oladi.",
            'Вызовите курьера в приложении Yandex Go (раздел «Доставка»): забрать — в аптеке, доставить — по адресу клиента. Аптека оплачивает курьера и берёт с клиента стоимость доставки.')}
        </p>
      </div>

      <Sozlamalar />
    </div>
  )
}

function Sozlamalar() {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [s, setS] = useState<YetkazishSozlama | null>(null)
  const [xabar, setXabar] = useState('')
  useEffect(() => { dxSozlama().then(setS).catch(() => {}) }, [])
  if (!s) return null

  const ozgar = (k: keyof YetkazishSozlama, v: unknown) => setS({ ...s, [k]: v } as YetkazishSozlama)
  const saqla = async () => {
    setXabar('')
    try {
      setS(await dxSozlamaYoz(s))
      setXabar(L('Saqlandi', 'Сохранено'))
    } catch (e) {
      setXabar((e as Error).message)
    }
  }
  const raqam = (k: 'narx' | 'km_narxi' | 'bepul_chegara' | 'min_summa' | 'radius_km', yorliq: string, izoh?: string) => (
    <label className="block">
      <span className="text-sm font-semibold text-ink-dim">{yorliq}</span>
      <input type="number" min={0} className={inputCls} value={s[k] ?? 0} onChange={(e) => ozgar(k, e.target.value === '' ? 0 : Number(e.target.value))} />
      {izoh && <span className="text-xs text-ink-faint">{izoh}</span>}
    </label>
  )

  return (
    <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
      <h3 className="font-bold text-ink">{L('Yetkazish sozlamalari', 'Настройки доставки')}</h3>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={s.yoqilgan} onChange={(e) => ozgar('yoqilgan', e.target.checked)} />
        {L('Yetkazib beraman (saytda "Yetkazib bering" tugmasi chiqadi)', 'Доставляю (на сайте появится кнопка «Доставка»)')}
      </label>
      {(s.latitude == null || s.longitude == null) && (
        <p className="text-sm text-amber-700">{L("Avval \"Ma'lumot\" bo'limida dorixonaning xaritadagi joyini kiriting — masofa shundan hisoblanadi.",
          'Сначала укажите место аптеки на карте в разделе «Информация» — от него считается расстояние.')}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {raqam('narx', L("Yetkazish narxi (so'm)", 'Стоимость доставки (сум)'), L('Har buyurtma uchun asosiy narx', 'Базовая цена за заказ'))}
        {raqam('km_narxi', L("Har km uchun qo'shimcha (so'm)", 'Доплата за км (сум)'), L("0 — masofadan qat'i nazar bir xil", '0 — одинаково на любое расстояние'))}
        {raqam('bepul_chegara', L("Shu summadan oshsa bepul (so'm)", 'Бесплатно от суммы (сум)'), L("0 — bepul yetkazish yo'q", '0 — без бесплатной доставки'))}
        {raqam('min_summa', L("Eng kam buyurtma (so'm)", 'Минимальный заказ (сум)'))}
        {raqam('radius_km', L('Yetkazish radiusi (km)', 'Радиус доставки (км)'))}
        <label className="block">
          <span className="text-sm font-semibold text-ink-dim">{L('Karta raqami (oldindan to\'lov uchun)', 'Номер карты (для предоплаты)')}</span>
          <input className={inputCls} value={s.karta_raqami ?? ''} onChange={(e) => ozgar('karta_raqami', e.target.value)} placeholder="8600 0000 0000 0000" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={s.naqd} onChange={(e) => ozgar('naqd', e.target.checked)} />
        {L("Yetkazilganda to'lovni qabul qilaman (o'z kuryerim naqd/karta oladi)", 'Принимаю оплату при получении (мой курьер берёт наличные/карту)')}
      </label>
      <p className="text-xs text-ink-faint">{L("Yandex Go kuryeri bilan yuborsangiz, faqat oldindan kartaga to'lovni qoldiring: Yandex kuryeri dori pulini olib kelmaydi.",
        'Если отправляете курьером Yandex Go, оставьте только предоплату на карту: курьер Yandex не привозит деньги за товар.')}</p>
      <div className="flex items-center gap-3">
        <Button onClick={saqla}><Save className="w-4 h-4" /> {L('Saqlash', 'Сохранить')}</Button>
        {xabar && <span className="text-sm text-ink-dim">{xabar}</span>}
      </div>
    </div>
  )
}

/** Admin: barcha dorixonalarning yetkazish buyurtmalari (faqat ko'rish). */
export function AdminYetkazishlar() {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [royxat, setRoyxat] = useState<Yetkazish[] | null>(null)
  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/admin/yetkazish', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : [])).then(setRoyxat).catch(() => setRoyxat([]))
  }, [])
  if (royxat === null) return <p className="text-sm text-ink-dim">{L('Yuklanmoqda...', 'Загрузка...')}</p>
  if (royxat.length === 0) return <p className="text-sm text-ink-dim">{L("Yetkazish buyurtmalari hali yo'q", 'Заказов на доставку пока нет')}</p>
  return (
    <div className="divide-y divide-slate-100">
      {royxat.map((y) => {
        const h = HOLAT_NOMI[y.holat]
        return (
          <div key={y.id} className="py-2.5 text-sm flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-ink">№{y.id} · {y.dorixona_nomi}</div>
              <div className="text-xs text-ink-dim">{y.mijoz_ismi || '—'} · {y.mijoz_telefon || ''} · {som(y.jami)} {L("so'm", 'сум')} · {new Date(y.sana).toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}</div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${h.rang}`}>{lang === 'ru' ? h.ru : h.uz}</span>
          </div>
        )
      })}
    </div>
  )
}
