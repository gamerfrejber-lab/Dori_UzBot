import { useEffect, useState } from 'react'
import { ChevronDown, FileText, AlertTriangle } from 'lucide-react'
import { doriMalumot, type DoriMalumotJavob, type YoriqnomaTil } from '@/lib/api'

type Lang = 'uz' | 'ru'

const BOLIMLAR: { kalit: keyof YoriqnomaTil; uz: string; ru: string }[] = [
  { kalit: 'qollanilishi', uz: 'Nimaga yordam beradi', ru: 'Показания' },
  { kalit: 'qabul_qilish', uz: 'Qanday qabul qilinadi', ru: 'Способ применения' },
  { kalit: 'doza', uz: 'Dozasi', ru: 'Дозировка' },
  { kalit: 'mumkin_emas', uz: 'Kimlarga mumkin emas', ru: 'Противопоказания' },
  { kalit: 'birga_ichilmaydi', uz: 'Nima bilan birga ichilmaydi', ru: 'Взаимодействие' },
  { kalit: 'nojoya', uz: "Nojo'ya ta'sirlari", ru: 'Побочные эффекты' },
  { kalit: 'homiladorlik', uz: 'Homiladorlik va emizish', ru: 'Беременность и кормление' },
  { kalit: 'ehtiyot', uz: 'Ehtiyot choralari', ru: 'Особые указания' },
]

/**
 * Dori oynasidagi yo'riqnoma: qo'llanilishi, qabul qilish tartibi, dozasi, qarshi ko'rsatmalar va h.k.
 * Ma'lumot hali tayyor bo'lmasa yoki ishonchsiz bo'lsa hech narsa (yoki qisqa izoh) ko'rsatiladi.
 */
export function DoriYoriqnoma({ nomi, lang }: { nomi: string; lang: Lang }) {
  const [javob, setJavob] = useState<DoriMalumotJavob | null>(null)
  const [ochiq, setOchiq] = useState<string | null>('qollanilishi')

  useEffect(() => {
    let bekor = false
    setJavob(null)
    if (!nomi) return
    doriMalumot(nomi).then((j) => { if (!bekor) setJavob(j) }).catch(() => {})
    return () => { bekor = true }
  }, [nomi])

  if (!javob) return null
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const m = javob.malumot
  // Katalogda davlat katta harflarda ("УЗБЕКИСТАН") — "Узбекистан" ko'rinishiga keltiramiz.
  const davlat = javob.davlat ? javob.davlat.toLowerCase().replace(/(^|[\s-])\S/g, (h) => h.toUpperCase()) : null

  if (javob.holat !== 'TAYYOR' || !m || m.dori_emas) {
    if (javob.holat === 'KUTMOQDA' || javob.holat === 'NAVBATDA') {
      return (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-ink-dim">
          {davlat && <p className="mb-1"><span className="text-ink-faint">{L('Davlat:', 'Страна:')}</span> <span className="text-ink">{davlat}</span></p>}
          {L("Yo'riqnoma tayyorlanmoqda — tez orada shu yerda chiqadi.", 'Инструкция готовится — скоро появится здесь.')}
        </div>
      )
    }
    return davlat ? (
      <p className="mt-2 text-sm"><span className="text-ink-dim">{L('Davlat:', 'Страна:')}</span> <span className="text-ink">{davlat}</span></p>
    ) : null
  }

  const t = (lang === 'ru' ? m.ru : m.uz) || m.uz
  const ishonchsiz = m.ishonch === 'past'

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 bg-brand/5 px-4 py-3">
        <FileText className="w-5 h-5 text-brand shrink-0" />
        <h3 className="font-bold text-ink">{L("Yo'riqnoma", 'Инструкция')}</h3>
        {m.retseptli ? (
          <span className="ml-auto rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">{L('Retsept bilan', 'По рецепту')}</span>
        ) : (
          <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">{L('Retseptsiz', 'Без рецепта')}</span>
        )}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-4 pt-3 text-sm">
        {m.tasir_moddasi && (<><dt className="text-ink-dim">{L("Ta'sir etuvchi modda:", 'Действующее вещество:')}</dt><dd className="text-ink font-medium">{m.tasir_moddasi}</dd></>)}
        {t.guruh && (<><dt className="text-ink-dim">{L('Guruhi:', 'Группа:')}</dt><dd className="text-ink">{t.guruh}</dd></>)}
        {davlat && (<><dt className="text-ink-dim">{L('Davlat:', 'Страна:')}</dt><dd className="text-ink">{davlat}</dd></>)}
      </dl>

      {ishonchsiz ? (
        <p className="px-4 py-3 text-sm text-ink-dim">
          {L("Bu mahsulot bo'yicha ishonchli yo'riqnoma topilmadi. Qadoqdagi yo'riqnomani o'qing yoki farmatsevtdan so'rang.",
            'Надёжная инструкция по этому товару не найдена. Прочитайте вкладыш в упаковке или спросите фармацевта.')}
        </p>
      ) : (
        <div className="divide-y divide-slate-100 mt-2">
          {BOLIMLAR.map((b) => {
            const qiymat = t[b.kalit]
            const bandlar = Array.isArray(qiymat) ? qiymat.filter(Boolean) : qiymat ? [qiymat] : []
            if (!bandlar.length) return null
            const korinadi = ochiq === b.kalit
            return (
              <div key={b.kalit}>
                <button
                  type="button"
                  onClick={() => setOchiq(korinadi ? null : b.kalit)}
                  aria-expanded={korinadi}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold text-ink hover:bg-slate-50"
                >
                  {lang === 'ru' ? b.ru : b.uz}
                  <ChevronDown className={`w-4 h-4 text-ink-faint transition-transform ${korinadi ? 'rotate-180' : ''}`} />
                </button>
                {korinadi && (
                  <ul className="list-disc space-y-1 pb-3 pl-9 pr-4 text-sm text-ink">
                    {bandlar.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="flex gap-2 border-t border-slate-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {L("Ma'lumot tanishish uchun. Qabul qilishdan oldin shifokor yoki farmatsevt bilan maslahatlashing va qadoqdagi yo'riqnomani o'qing.",
          'Информация для ознакомления. Перед применением проконсультируйтесь с врачом или фармацевтом и прочитайте инструкцию в упаковке.')}
      </p>
    </section>
  )
}
