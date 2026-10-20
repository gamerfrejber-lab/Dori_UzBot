import { useCallback, useEffect, useState } from 'react'
import { Search, RefreshCw, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLanguage'
import { authJson } from '@/lib/panel'
import { cn } from '@/lib/utils'

interface Holat {
  soni: Record<string, number>
  ustuvorKutmoqda: number
  rejim: 'ustuvor' | 'toliq' | 'toxtatilgan'
  sarflanganUsd: number
  oxirgiXato: string
  kalitUlangan: boolean
  model: string
}

interface Qator {
  id: number
  kalit: string
  holat: string
  ustuvor: number
  ishlab_chiqaruvchi: string | null
  davlat: string | null
  tahrirlangan: boolean | null
  xato: string | null
  malumot: string | null
}

/** Bitta yo'riqnoma taxminan shuncha turadi (Opus 5.5, yarim narxli to'plam rejimi). */
const BIR_DORI_USD = 0.02

const HOLAT_NOMI: Record<string, [string, string, string]> = {
  TAYYOR: ['Tayyor', 'Готово', 'bg-green-100 text-green-700'],
  KUTMOQDA: ['Navbatda', 'В очереди', 'bg-slate-100 text-ink-dim'],
  NAVBATDA: ['Yozilmoqda', 'Пишется', 'bg-blue-100 text-blue-700'],
  DORI_EMAS: ['Dori emas', 'Не лекарство', 'bg-slate-100 text-ink-faint'],
  XATO: ['Xato', 'Ошибка', 'bg-red-100 text-red-700'],
}

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30'

/** Admin: dori yo'riqnomalarini sun'iy intellekt yozishini boshqarish va qo'lda tuzatish. */
export function YoriqnomaBoshqaruv() {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [holat, setHolat] = useState<Holat | null>(null)
  const [q, setQ] = useState('')
  const [filtr, setFiltr] = useState('')
  const [qatorlar, setQatorlar] = useState<Qator[] | null>(null)
  const [ochiq, setOchiq] = useState<number | null>(null)

  const holatniYukla = useCallback(() => {
    authJson<Holat>('/api/admin/malumot/holat').then(setHolat).catch(() => {})
  }, [])

  const royxatniYukla = useCallback(() => {
    const p = new URLSearchParams({ limit: '50' })
    if (q.trim()) p.set('q', q.trim())
    if (filtr) p.set('holat', filtr)
    authJson<Qator[]>('/api/admin/malumot?' + p).then(setQatorlar).catch(() => setQatorlar([]))
  }, [q, filtr])

  useEffect(holatniYukla, [holatniYukla])
  useEffect(() => {
    const t = setTimeout(royxatniYukla, 300)
    return () => clearTimeout(t)
  }, [royxatniYukla])

  const rejimTanla = async (rejim: Holat['rejim']) => {
    const h = await authJson<Holat>('/api/admin/malumot/rejim', { method: 'POST', body: JSON.stringify({ rejim }) })
    setHolat(h)
  }

  const s = holat?.soni || {}
  const kutmoqda = s.KUTMOQDA || 0
  const usd = (n: number) => '$' + n.toFixed(n < 10 ? 2 : 0)

  return (
    <div className="space-y-4">
      {holat && !holat.kalitUlangan && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {L("Sun'iy intellekt kaliti ulanmagan", 'Ключ ИИ не подключён')}</p>
          <p className="mt-1">
            {L("Railway'da sayt servisiga ANTHROPIC_API_KEY o'zgaruvchisini qo'shing — shundan keyin yo'riqnomalar o'zi yozila boshlaydi.",
              'Добавьте переменную ANTHROPIC_API_KEY в сервис сайта на Railway — после этого инструкции начнут писаться автоматически.')}
          </p>
        </div>
      )}

      {holat && (
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            {(['TAYYOR', 'NAVBATDA', 'KUTMOQDA', 'DORI_EMAS', 'XATO'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFiltr(filtr === k ? '' : k)}
                className={cn('rounded-xl p-2 border', filtr === k ? 'border-brand bg-brand/5' : 'border-slate-100 bg-slate-50')}
              >
                <div className="text-lg font-extrabold text-ink tabular-nums">{(s[k] || 0).toLocaleString('ru-RU')}</div>
                <div className="text-xs text-ink-dim">{lang === 'ru' ? HOLAT_NOMI[k][1] : HOLAT_NOMI[k][0]}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-dim">
            {L('Sarflangan:', 'Потрачено:')} <b className="text-ink">{usd(holat.sarflanganUsd)}</b>
            {' · '}{L('Model:', 'Модель:')} {holat.model}
          </p>
          {holat.oxirgiXato && (
            <p className="mt-1 text-xs text-red-600 break-words">{L('Oxirgi xato:', 'Последняя ошибка:')} {holat.oxirgiXato}</p>
          )}

          <p className="mt-4 mb-2 text-sm font-bold text-ink">{L('Qaysi dorilarga yozilsin?', 'Для каких лекарств писать?')}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <RejimTugma faol={holat.rejim === 'ustuvor'} onClick={() => rejimTanla('ustuvor')}
              nom={L('Sotuvdagilar (tavsiya)', 'Только в продаже (реком.)')}
              izoh={L(`Dorixonalardagi va saytda ochilgan dorilar. Qolgani: ${holat.ustuvorKutmoqda} ta ≈ ${usd(holat.ustuvorKutmoqda * BIR_DORI_USD)}`,
                `В аптеках и открытые на сайте. Осталось: ${holat.ustuvorKutmoqda} ≈ ${usd(holat.ustuvorKutmoqda * BIR_DORI_USD)}`)} />
            <RejimTugma faol={holat.rejim === 'toliq'} onClick={() => rejimTanla('toliq')}
              nom={L('Butun katalog', 'Весь каталог')}
              izoh={L(`Hamma dorilar. Qolgani: ${kutmoqda} ta ≈ ${usd(kutmoqda * BIR_DORI_USD)}`,
                `Все лекарства. Осталось: ${kutmoqda} ≈ ${usd(kutmoqda * BIR_DORI_USD)}`)} />
            <RejimTugma faol={holat.rejim === 'toxtatilgan'} onClick={() => rejimTanla('toxtatilgan')}
              nom={L("To'xtatish", 'Остановить')}
              izoh={L('Yangi so\'rov yuborilmaydi, pul sarflanmaydi.', 'Новые запросы не отправляются.')} />
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            {L("Narx taxminiy: bitta dori ≈ $0.02. Har 10 daqiqada 300 tadan yuboriladi, javob odatda 1 soat ichida keladi.",
              'Цена ориентировочная: одно лекарство ≈ $0.02. Отправляется по 300 каждые 10 минут, ответ обычно в течение часа.')}
          </p>
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
        <input className={inputCls + ' pl-9'} placeholder={L('Dori nomi', 'Название')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
        {qatorlar === null && <p className="p-4 text-sm text-ink-dim">{L('Yuklanmoqda...', 'Загрузка...')}</p>}
        {qatorlar?.length === 0 && <p className="p-4 text-sm text-ink-dim">{L('Topilmadi', 'Не найдено')}</p>}
        {qatorlar?.map((r) => (
          <QatorKorinish key={r.id} r={r} ochiq={ochiq === r.id} onToggle={() => setOchiq(ochiq === r.id ? null : r.id)}
            onYangilandi={() => { royxatniYukla(); holatniYukla() }} />
        ))}
      </div>
    </div>
  )
}

function RejimTugma({ faol, onClick, nom, izoh }: { faol: boolean; onClick: () => void; nom: string; izoh: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={faol}
      className={cn('rounded-xl border p-3 text-left', faol ? 'border-brand bg-brand/5 ring-1 ring-brand' : 'border-slate-200 bg-white')}>
      <div className="text-sm font-bold text-ink">{nom}</div>
      <div className="mt-0.5 text-xs text-ink-dim">{izoh}</div>
    </button>
  )
}

function QatorKorinish({ r, ochiq, onToggle, onYangilandi }: { r: Qator; ochiq: boolean; onToggle: () => void; onYangilandi: () => void }) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [matn, setMatn] = useState('')
  const [xabar, setXabar] = useState('')
  const h = HOLAT_NOMI[r.holat] || [r.holat, r.holat, 'bg-slate-100 text-ink-dim']

  useEffect(() => {
    if (!ochiq) return
    setXabar('')
    try {
      setMatn(r.malumot ? JSON.stringify(JSON.parse(r.malumot), null, 2) : '')
    } catch {
      setMatn(r.malumot || '')
    }
  }, [ochiq, r.malumot])

  const saqla = async () => {
    try {
      JSON.parse(matn)
    } catch {
      setXabar(L("JSON noto'g'ri — qavs yoki vergulni tekshiring", 'Неверный JSON — проверьте скобки и запятые'))
      return
    }
    try {
      await authJson(`/api/admin/malumot/${r.id}`, { method: 'PUT', body: matn })
      setXabar(L('Saqlandi', 'Сохранено'))
      onYangilandi()
    } catch (e) {
      setXabar((e as Error).message)
    }
  }

  const qayta = async () => {
    await authJson(`/api/admin/malumot/${r.id}/qayta`, { method: 'POST' })
    setXabar(L('Navbatga qo\'yildi — keyingi to\'plamda qayta yoziladi', 'Поставлено в очередь'))
    onYangilandi()
  }

  return (
    <div>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">{r.kalit}</div>
          <div className="truncate text-xs text-ink-faint">{[r.ishlab_chiqaruvchi, r.davlat].filter(Boolean).join(', ') || '—'}</div>
        </div>
        {r.tahrirlangan && <span className="text-[11px] text-ink-faint">{L('tuzatilgan', 'исправлено')}</span>}
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', h[2])}>{lang === 'ru' ? h[1] : h[0]}</span>
      </button>
      {ochiq && (
        <div className="space-y-2 px-4 pb-4">
          {r.xato && <p className="text-xs text-red-600 break-words">{r.xato}</p>}
          <textarea
            className={inputCls + ' h-72 font-mono text-xs'}
            value={matn}
            onChange={(e) => setMatn(e.target.value)}
            placeholder={L("Yo'riqnoma hali yozilmagan", 'Инструкция ещё не написана')}
            spellCheck={false}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={saqla} disabled={!matn.trim()}><Save className="w-4 h-4" /> {L('Saqlash', 'Сохранить')}</Button>
            <Button variant="secondary" onClick={qayta} disabled={r.holat === 'NAVBATDA'}>
              <RefreshCw className="w-4 h-4" /> {L('Qayta yozdirish', 'Переписать')}
            </Button>
          </div>
          {xabar && <p className="text-sm text-ink-dim">{xabar}</p>}
        </div>
      )}
    </div>
  )
}
