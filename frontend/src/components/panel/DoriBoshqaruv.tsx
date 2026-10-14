import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Upload, Trash2, Pencil, Check, X, Search, PackagePlus, PackageMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLanguage'
import { doriKartaNomi } from '@/lib/cyrillic'
import { som, type DoriApi, type PanelDori } from '@/lib/panel'

const PAGE = 40
const inputCls =
  'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30'

/**
 * Mahsulotlar va ombor — botdagi "📦 Mahsulotlarim", "➕ Mahsulot qo'shish" (qo'lda / fayldan),
 * "✏️ Narx tahrirlash", "📥 Kirim", "📤 Chiqim", "🗑 O'chirish" ning saytdagi ko'rinishi.
 * Admin ham, dorixonachi ham shu blokdan foydalanadi; farqi faqat server manzillarida.
 */
export function DoriBoshqaruv({ api, onChanged }: { api: DoriApi; onChanged?: () => void }) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [dorilar, setDorilar] = useState<PanelDori[]>([])
  const [loading, setLoading] = useState(true)
  const [xabar, setXabar] = useState<{ ok: boolean; text: string } | null>(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [showAdd, setShowAdd] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    api.list().then(setDorilar).catch(() => setDorilar([])).finally(() => setLoading(false))
  }
  useEffect(load, [api])
  // Ro'yxat va undagi qoldiq o'zgargach, tepadagi hisobot ham yangilansin.
  const reload = () => { load(); onChanged?.() }

  const notify = (ok: boolean, text: string) => {
    setXabar({ ok, text })
    window.setTimeout(() => setXabar(null), 4000)
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return dorilar
    return dorilar.filter((d) =>
      [d.name, d.nameRu, d.manufacturer].some((v) => (v || '').toLowerCase().includes(s)))
  }, [dorilar, q])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE)

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const r = await api.importFile(file)
      notify(true, L(`Fayldan ${r.soni ?? 0} ta mahsulot qo'shildi. Nomlar bir necha daqiqada o'zi tozalanadi.`,
        `Из файла добавлено: ${r.soni ?? 0}. Названия очистятся автоматически через несколько минут.`))
      reload()
    } catch (err) {
      notify(false, (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="w-4 h-4" /> {L("Qo'lda qo'shish", 'Добавить вручную')}
        </Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Upload className="w-4 h-4" /> {busy ? '...' : L('Fayldan (Excel)', 'Из файла (Excel)')}
        </Button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} />
      </div>

      {xabar && (
        <p className={`mb-3 text-sm font-semibold rounded-xl px-3 py-2 ${xabar.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {xabar.text}
        </p>
      )}

      {showAdd && (
        <QoshishForma
          onCancel={() => setShowAdd(false)}
          onSave={async (d) => {
            await api.add(d)
            setShowAdd(false)
            notify(true, L("Mahsulot qo'shildi", 'Товар добавлен'))
            reload()
          }}
        />
      )}

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(0) }}
          placeholder={L('Mahsulot qidirish...', 'Поиск товара...')}
          className={inputCls + ' pl-9'}
        />
      </div>
      <p className="text-xs text-ink-faint mb-2">
        {L(`Jami: ${filtered.length} ta mahsulot`, `Всего: ${filtered.length}`)}
      </p>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-[3px] border-brand/30 border-t-brand rounded-full animate-spin" /></div>
      ) : shown.length === 0 ? (
        <p className="text-ink-dim text-center py-8">{L('Mahsulot topilmadi', 'Товары не найдены')}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {shown.map((d) => (
            <DoriQator key={d.id} d={d} api={api} onChanged={reload} notify={notify} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>◀</Button>
          <span className="text-sm text-ink-dim">{page + 1} / {pages}</span>
          <Button size="sm" variant="secondary" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>▶</Button>
        </div>
      )}
    </div>
  )
}

function QoshishForma({ onSave, onCancel }: { onSave: (d: Partial<PanelDori>) => Promise<void>; onCancel: () => void }) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [f, setF] = useState({ name: '', nameRu: '', manufacturer: '', price: '', pachkaNarx: '' })
  const [saving, setSaving] = useState(false)
  const [xato, setXato] = useState('')
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  const save = async () => {
    if (!f.name.trim() || !f.price) {
      setXato(L('Nomi va narxi majburiy', 'Название и цена обязательны'))
      return
    }
    setSaving(true)
    setXato('')
    try {
      await onSave({
        name: f.name.trim(),
        nameRu: f.nameRu.trim() || null,
        manufacturer: f.manufacturer.trim() || null,
        price: Number(f.price),
        pachkaNarx: f.pachkaNarx ? Number(f.pachkaNarx) : null,
        available: true,
      })
    } catch (e) {
      setXato((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-4 p-4 rounded-2xl bg-brand/5 border border-brand/20 grid gap-3 sm:grid-cols-2">
      <input className={inputCls} placeholder={L('Nomi (o\'zbekcha) *', 'Название (узб) *')} value={f.name} onChange={set('name')} />
      <input className={inputCls} placeholder={L('Ruscha nomi', 'Название (рус)')} value={f.nameRu} onChange={set('nameRu')} />
      <input className={inputCls} placeholder={L('Ishlab chiqaruvchi', 'Производитель')} value={f.manufacturer} onChange={set('manufacturer')} />
      <div className="flex gap-2">
        <input className={inputCls} type="number" min="0" placeholder={L("Dona narxi, so'm *", 'Цена за шт., сум *')} value={f.price} onChange={set('price')} />
        <input className={inputCls} type="number" min="0" placeholder={L('Pachka narxi', 'Цена упаковки')} value={f.pachkaNarx} onChange={set('pachkaNarx')} />
      </div>
      {xato && <p className="text-sm text-red-600 sm:col-span-2">{xato}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button size="sm" variant="success" disabled={saving} onClick={save}><Check className="w-4 h-4" /> {L('Saqlash', 'Сохранить')}</Button>
        <Button size="sm" variant="secondary" onClick={onCancel}><X className="w-4 h-4" /> {L('Bekor', 'Отмена')}</Button>
      </div>
    </div>
  )
}

type Rejim = null | 'narx' | 'kirim' | 'chiqim' | 'ochir'

function DoriQator({ d, api, onChanged, notify }: {
  d: PanelDori
  api: DoriApi
  onChanged: () => void
  notify: (ok: boolean, text: string) => void
}) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [rejim, setRejim] = useState<Rejim>(null)
  const [narx, setNarx] = useState(String(d.price ?? ''))
  const [pachka, setPachka] = useState(d.pachkaNarx ? String(d.pachkaNarx) : '')
  const [soni, setSoni] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true)
    try {
      await fn()
      notify(true, okText)
      setRejim(null)
      setSoni('')
      onChanged()
    } catch (e) {
      notify(false, (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const nom = doriKartaNomi({ name: d.name, nameRu: d.nameRu }, lang)

  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-ink text-sm">{nom}</div>
          <div className="text-xs text-ink-dim mt-0.5">
            {d.manufacturer ? `${d.manufacturer} · ` : ''}
            {som(d.price)} {L("so'm", 'сум')}
            {d.pachkaNarx ? ` · ${L('pachka', 'упак.')} ${som(d.pachkaNarx)}` : ''}
            {d.hisobYuritiladi
              ? <span className={(d.qoldiq || 0) > 0 ? 'text-green-700' : 'text-red-600'}> · {L('qoldiq', 'остаток')}: {d.qoldiq}</span>
              : <span className="text-ink-faint"> · {L('ombor hisobi yuritilmaydi', 'учёт склада не ведётся')}</span>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <IconBtn title={L('Narx', 'Цена')} onClick={() => setRejim(rejim === 'narx' ? null : 'narx')}><Pencil className="w-4 h-4" /></IconBtn>
          <IconBtn title={L('Kirim', 'Приход')} onClick={() => setRejim(rejim === 'kirim' ? null : 'kirim')}><PackagePlus className="w-4 h-4" /></IconBtn>
          <IconBtn title={L('Chiqim', 'Расход')} onClick={() => setRejim(rejim === 'chiqim' ? null : 'chiqim')}><PackageMinus className="w-4 h-4" /></IconBtn>
          <IconBtn title={L("O'chirish", 'Удалить')} danger onClick={() => setRejim(rejim === 'ochir' ? null : 'ochir')}><Trash2 className="w-4 h-4" /></IconBtn>
        </div>
      </div>

      {rejim === 'narx' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input className={inputCls + ' max-w-[160px]'} type="number" min="0" value={narx} onChange={(e) => setNarx(e.target.value)} placeholder={L('Dona narxi', 'Цена за шт.')} />
          <input className={inputCls + ' max-w-[160px]'} type="number" min="0" value={pachka} onChange={(e) => setPachka(e.target.value)} placeholder={L('Pachka narxi', 'Цена упаковки')} />
          <Button size="sm" variant="success" disabled={busy || !narx}
            onClick={() => run(() => api.update(d.id, { price: Number(narx), pachkaNarx: pachka ? Number(pachka) : null }), L('Narx yangilandi', 'Цена обновлена'))}>
            <Check className="w-4 h-4" /> {L('Saqlash', 'Сохранить')}
          </Button>
        </div>
      )}

      {(rejim === 'kirim' || rejim === 'chiqim') && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink-dim">
            {rejim === 'kirim' ? L('Keldi (dona):', 'Поступило (шт.):') : L('Sotildi (dona):', 'Продано (шт.):')}
          </span>
          <input className={inputCls + ' max-w-[120px]'} type="number" min="1" value={soni} onChange={(e) => setSoni(e.target.value)} autoFocus />
          <Button size="sm" variant={rejim === 'kirim' ? 'success' : 'default'} disabled={busy || !(Number(soni) > 0)}
            onClick={() => run(() => api.stock(rejim, d.id, Number(soni)),
              rejim === 'kirim' ? L('Kirim yozildi', 'Приход записан') : L('Sotuv yozildi', 'Продажа записана'))}>
            <Check className="w-4 h-4" /> {L('Yozish', 'Записать')}
          </Button>
        </div>
      )}

      {rejim === 'ochir' && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2">
          <span className="text-sm text-red-700">{L("Rostdan o'chirilsinmi? Bronlari va ombor yozuvlari ham o'chadi.", 'Удалить? Брони и записи склада тоже удалятся.')}</span>
          <Button size="sm" variant="destructive" disabled={busy}
            onClick={() => run(() => api.remove(d.id), L("O'chirildi", 'Удалено'))}>
            {L("Ha, o'chirish", 'Да, удалить')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setRejim(null)}>{L("Yo'q", 'Нет')}</Button>
        </div>
      )}
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${danger ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-ink-dim hover:text-brand hover:bg-brand/5'}`}
    >
      {children}
    </button>
  )
}
