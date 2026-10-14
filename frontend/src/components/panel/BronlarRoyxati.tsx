import { useEffect, useState } from 'react'
import { Check, X, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLanguage'
import { authJson, som, BRON_HOLAT } from '@/lib/panel'

interface BronRow {
  id: number
  kod: string
  holat: string
  soni: number
  tur: string
  sana: string | null
  doriNomi?: string
  dori_nomi?: string
  narx?: number
  mijozIsmi?: string
  mijoz_ismi?: string
  mijozTelefon?: string
  mijoz_telefon?: string
  dorixona_nomi?: string
}

/**
 * Bronlar ro'yxati. Dorixonachi uchun botdagi tugmalar bilan bir xil: Yangi → "Tayyor",
 * Tayyor → "Berildi" (ombordan chiqim yoziladi), berilmagan bronni "Bekor" qilish mumkin.
 * Admin uchun (botdagi "🔔 Buyurtmalar") faqat ko'rish.
 */
export function BronlarRoyxati({ url, canEdit }: { url: string; canEdit: boolean }) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [rows, setRows] = useState<BronRow[]>([])
  const [loading, setLoading] = useState(true)
  const [faqatFaol, setFaqatFaol] = useState(true)
  const [xabar, setXabar] = useState<{ ok: boolean; text: string } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    authJson<BronRow[]>(url).then(setRows).catch(() => setRows([])).finally(() => setLoading(false))
  }
  useEffect(load, [url])

  const holat = async (id: number, yangi: string) => {
    setBusyId(id)
    try {
      const r = await authJson<{ ogohlantirish?: string }>(`/api/dorixonachi/bron/${id}/holat`, {
        method: 'POST',
        body: JSON.stringify({ holat: yangi }),
      })
      setXabar(r.ogohlantirish
        ? { ok: false, text: r.ogohlantirish }
        : { ok: true, text: L('Saqlandi — mijozga bot orqali xabar boradi.', 'Сохранено — клиент получит уведомление в боте.') })
      load()
    } catch (e) {
      setXabar({ ok: false, text: (e as Error).message })
      load()
    } finally {
      setBusyId(null)
    }
  }

  const visible = faqatFaol ? rows.filter((b) => b.holat === 'YANGI' || b.holat === 'TAYYOR') : rows

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Button size="sm" variant={faqatFaol ? 'default' : 'secondary'} onClick={() => setFaqatFaol(true)}>{L('Faol', 'Активные')}</Button>
        <Button size="sm" variant={faqatFaol ? 'secondary' : 'default'} onClick={() => setFaqatFaol(false)}>{L('Hammasi', 'Все')}</Button>
      </div>
      {xabar && (
        <p className={`mb-3 text-sm font-semibold rounded-xl px-3 py-2 ${xabar.ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>{xabar.text}</p>
      )}
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-[3px] border-brand/30 border-t-brand rounded-full animate-spin" /></div>
      ) : visible.length === 0 ? (
        <p className="text-ink-dim text-center py-8">{L("Bron yo'q", 'Броней нет')}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {visible.map((b) => {
            const h = BRON_HOLAT[b.holat] || { uz: b.holat, ru: b.holat, cls: 'bg-slate-100 text-slate-600' }
            const ism = b.mijozIsmi || b.mijoz_ismi
            const tel = b.mijozTelefon || b.mijoz_telefon
            return (
              <div key={b.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink text-sm">{b.doriNomi || b.dori_nomi}</div>
                    {b.dorixona_nomi && <div className="text-xs text-brand font-semibold">{b.dorixona_nomi}</div>}
                    <div className="text-xs text-ink-dim mt-0.5">
                      {ism || L('Mijoz', 'Клиент')}{tel ? ` · ${tel}` : ''}
                    </div>
                    <div className="text-xs text-ink-faint mt-0.5">
                      {b.soni} {(b.tur || '').toLowerCase() === 'pachka' ? L('pachka', 'упак.') : L('dona', 'шт.')}
                      {b.narx ? ` · ${som(b.narx)} ${L("so'm", 'сум')}` : ''}
                      {' · '}{L('Kod', 'Код')}: <span className="font-bold text-brand">{b.kod}</span>
                      {b.sana ? ` · ${new Date(b.sana).toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')}` : ''}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${h.cls}`}>{lang === 'ru' ? h.ru : h.uz}</span>
                </div>
                {canEdit && (b.holat === 'YANGI' || b.holat === 'TAYYOR') && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {b.holat === 'YANGI' && (
                      <Button size="sm" variant="success" disabled={busyId === b.id} onClick={() => holat(b.id, 'TAYYOR')}>
                        <Check className="w-3 h-3" /> {L('Tayyorladim', 'Подготовил')}
                      </Button>
                    )}
                    {b.holat === 'TAYYOR' && (
                      <Button size="sm" disabled={busyId === b.id} onClick={() => holat(b.id, 'BERILDI')}>
                        <PackageCheck className="w-3 h-3" /> {L('Berildi', 'Выдано')}
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" disabled={busyId === b.id} onClick={() => holat(b.id, 'BEKOR')}>
                      <X className="w-3 h-3" /> {L('Bekor qilish', 'Отменить')}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
