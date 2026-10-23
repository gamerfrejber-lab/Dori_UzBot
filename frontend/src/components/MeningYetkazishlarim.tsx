import { useEffect, useState } from 'react'
import { Truck, Upload, Phone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useLang } from '@/hooks/useLanguage'
import { telHavola } from '@/lib/xarita'
import { HOLAT_NOMI, som, yetkazishBekor, yetkazishChek, yetkazishMeniki, type Yetkazish } from '@/lib/yetkazish'

/** Profil sahifasidagi "Yetkazish buyurtmalarim": holati, tarkibi, kartaga to'lov cheki, bekor qilish. */
export function MeningYetkazishlarim() {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [royxat, setRoyxat] = useState<Yetkazish[] | null>(null)
  const [xabar, setXabar] = useState<Record<number, string>>({})

  const yukla = () => yetkazishMeniki().then(setRoyxat).catch(() => setRoyxat([]))
  useEffect(() => { yukla() }, [])

  const almashtir = (y: Yetkazish) => setRoyxat((r) => (r || []).map((x) => (x.id === y.id ? y : x)))
  const bekor = async (id: number) => {
    if (!confirm(L('Buyurtmani bekor qilasizmi?', 'Отменить заказ?'))) return
    try { almashtir(await yetkazishBekor(id)) } catch (e) { setXabar((m) => ({ ...m, [id]: (e as Error).message })) }
  }
  const chek = async (id: number, f?: File) => {
    if (!f) return
    try {
      almashtir(await yetkazishChek(id, f))
      setXabar((m) => ({ ...m, [id]: L('Chek yuborildi', 'Чек отправлен') }))
    } catch (e) {
      setXabar((m) => ({ ...m, [id]: (e as Error).message }))
    }
  }

  if (!royxat || royxat.length === 0) return null

  return (
    <Card className="p-4 sm:p-6 mb-4">
      <h3 className="font-bold text-ink text-base sm:text-lg flex items-center gap-2 mb-3 sm:mb-4">
        <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Truck className="w-5 h-5 text-brand" />
        </div>
        {L('Yetkazish buyurtmalarim', 'Мои доставки')}
      </h3>
      <div className="divide-y divide-slate-100">
        {royxat.map((y) => {
          const h = HOLAT_NOMI[y.holat]
          return (
            <div key={y.id} className="py-3 text-sm space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">№{y.id} · {y.dorixona_nomi}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${h.rang}`}>{lang === 'ru' ? h.ru : h.uz}</span>
              </div>
              <div className="text-ink-dim">
                {y.qatorlar.map((q) => `${q.nomi} × ${q.soni}`).join(', ')}
              </div>
              <div className="text-ink-dim">
                {L('Jami', 'Итого')}: <b className="text-ink">{som(y.jami)} {L("so'm", 'сум')}</b>
                {' '}· {y.tolov_usuli === 'KARTA' ? L('kartaga oldindan', 'предоплата на карту') : L('yetkazilganda', 'при получении')}
              </div>
              {y.holat === 'QABUL' && y.taxminiy_daqiqa && (
                <div className="text-blue-700">{L(`Taxminan ${y.taxminiy_daqiqa} daqiqada yetkaziladi`, `Доставят примерно через ${y.taxminiy_daqiqa} мин`)}</div>
              )}
              {y.holat === 'YOLDA' && y.kuryer_telefon && (
                <a href={telHavola(y.kuryer_telefon)} className="inline-flex items-center gap-1 font-semibold text-brand">
                  <Phone className="w-3.5 h-3.5" /> {L('Kuryer', 'Курьер')}: {y.kuryer_telefon}
                </a>
              )}
              {y.holat === 'BEKOR' && y.bekor_sababi && <div className="text-red-600">{y.bekor_sababi}</div>}
              {y.tolov_usuli === 'KARTA' && (y.holat === 'YANGI' || y.holat === 'QABUL') && (
                <div className="text-ink-dim">
                  {y.tolov_holati === 'TASDIQLANDI' ? L("To'lov tasdiqlandi", 'Оплата подтверждена')
                    : y.tolov_holati === 'CHEK_YUBORILDI' ? L('Chek yuborilgan, dorixona tekshirmoqda', 'Чек отправлен, аптека проверяет')
                    : L("To'lov kutilmoqda", 'Ожидается оплата')}
                  {y.tolov_holati !== 'TASDIQLANDI' && (
                    <label className="ml-2 inline-flex items-center gap-1 font-semibold text-brand cursor-pointer">
                      <Upload className="w-3.5 h-3.5" /> {L('Chek yuborish', 'Отправить чек')}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => chek(y.id, e.target.files?.[0])} />
                    </label>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3">
                {y.dorixona_telefon && (
                  <a href={telHavola(y.dorixona_telefon)} className="text-xs font-semibold text-brand">{L('Dorixonaga qo\'ng\'iroq', 'Позвонить в аптеку')}</a>
                )}
                {y.holat === 'YANGI' && (
                  <button type="button" onClick={() => bekor(y.id)} className="text-xs font-semibold text-red-600">{L('Bekor qilish', 'Отменить')}</button>
                )}
              </div>
              {xabar[y.id] && <div className="text-xs text-ink-dim">{xabar[y.id]}</div>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
