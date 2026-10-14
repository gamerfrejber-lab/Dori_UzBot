import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Building2, Pill, Users, BarChart3, FileCheck, Bell, Plus, Check, X, Trash2, CalendarPlus, Pencil, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLang } from '@/hooks/useLanguage'
import { adminCheck } from '@/lib/api'
import { authJson, adminDoriApi, som, type Hisobot } from '@/lib/panel'
import { cn } from '@/lib/utils'
import { DoriBoshqaruv } from '@/components/panel/DoriBoshqaruv'
import { BronlarRoyxati } from '@/components/panel/BronlarRoyxati'
import { HisobotQisqa } from '@/components/panel/HisobotQisqa'

type Tab = 'stat' | 'dorixonalar' | 'dorilar' | 'arizalar' | 'bronlar' | 'users'

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30'

interface DorixonaRow {
  id: number
  nomi: string
  viloyat: string | null
  tuman: string | null
  manzil: string | null
  telefon: string | null
  ish_boshlanishi: string | null
  ish_tugashi: string | null
  shartnoma_tugash: string | null
  holat: string | null
  egasi_telegram_id: number | null
  egasi_ismi: string | null
  egasi_telefon: string | null
  dorilar_soni: number
  faol_bronlar: number
}

/**
 * Admin paneli — botlardagi admin menyusining saytdagi ko'rinishi: statistika, dorixonalar
 * (qo'shish, tahrirlash, obunani uzaytirish, o'chirish), har bir dorixonaning mahsulotlari va
 * ombori, egalik arizalari, buyurtmalar va foydalanuvchilar. Hammasi bot bilan bitta bazada,
 * shuning uchun bu yerdagi o'zgarish botda ham darhol ko'rinadi.
 */
export function Admin() {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [tab, setTab] = useState<Tab>('stat')
  const [tanlanganDx, setTanlanganDx] = useState<number | null>(null)

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    adminCheck(token).then((d) => setIsAdmin(d.admin)).catch(() => setIsAdmin(false))
  }, [token, navigate])

  if (isAdmin === null) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
      </section>
    )
  }
  if (!isAdmin) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-extrabold text-ink mb-2">{L("Ruxsat yo'q", 'Нет доступа')}</h2>
          <p className="text-ink-dim mb-6">{L('Bu sahifa faqat adminlar uchun.', 'Эта страница только для администраторов.')}</p>
          <Button onClick={() => navigate('/')}>{L('Bosh sahifaga', 'На главную')}</Button>
        </div>
      </section>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'stat', label: L('Statistika', 'Статистика'), icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'dorixonalar', label: L('Dorixonalar', 'Аптеки'), icon: <Building2 className="w-4 h-4" /> },
    { key: 'dorilar', label: L('Mahsulotlar va ombor', 'Товары и склад'), icon: <Pill className="w-4 h-4" /> },
    { key: 'arizalar', label: L('Arizalar', 'Заявки'), icon: <FileCheck className="w-4 h-4" /> },
    { key: 'bronlar', label: L('Buyurtmalar', 'Заказы'), icon: <Bell className="w-4 h-4" /> },
    { key: 'users', label: L('Foydalanuvchilar', 'Пользователи'), icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <section className="max-w-[1100px] mx-auto px-4 py-4 sm:py-6">
      <h1 className="text-xl sm:text-2xl font-extrabold text-ink flex items-center gap-2 mb-1">
        <Shield className="w-6 h-6 text-brand" /> {L('Admin paneli', 'Панель администратора')}
      </h1>
      <p className="text-ink-dim text-sm mb-4">
        {L("Botdagi admin menyusi bilan bir xil. Bu yerda qilingan o'zgarish botda ham darhol ko'rinadi.",
          'То же, что меню администратора в боте. Изменения здесь сразу видны и в боте.')}
      </p>
      <div className="flex gap-1.5 sm:gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all border',
              tab === t.key
                ? 'text-white bg-gradient-to-br from-brand-sea to-brand border-transparent shadow-[0_8px_20px_rgba(37,99,235,0.35)]'
                : 'text-ink-dim bg-white border-slate-100 hover:text-brand'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <Card className="p-4 sm:p-6">
        {tab === 'stat' && <StatistikaTab />}
        {tab === 'dorixonalar' && <DorixonalarTab onMahsulotlar={(id) => { setTanlanganDx(id); setTab('dorilar') }} />}
        {tab === 'dorilar' && <DorilarTab dxId={tanlanganDx} setDxId={setTanlanganDx} />}
        {tab === 'arizalar' && <ArizalarTab />}
        {tab === 'bronlar' && <BronlarRoyxati url="/api/admin/bronlar" canEdit={false} />}
        {tab === 'users' && <UsersTab />}
      </Card>
    </section>
  )
}

function StatistikaTab() {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [s, setS] = useState<Record<string, number> | null>(null)
  const [ombor, setOmbor] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    authJson('/api/admin/stats').then(setS).catch(() => setS({}))
    authJson('/api/admin/ombor/umumiy').then(setOmbor).catch(() => setOmbor(null))
  }, [])
  if (!s) return <Spinner />
  const items: [string, number | undefined][] = [
    [L('Jami dorixonalar', 'Всего аптек'), s.dorixonalar],
    [L('Egasi ulangan', 'Подключено владельцев'), s.egasiUlangan],
    [L('Faol obunalar', 'Активных подписок'), s.faolObunalar],
    [L('Kutilayotgan arizalar', 'Заявок в ожидании'), s.kutilayotganArizalar],
    [L('Foydalanuvchilar', 'Пользователей'), s.foydalanuvchilar],
    [L('Dorixonalardagi mahsulotlar', 'Товаров в аптеках'), s.dorilar],
    [L('Katalogdagi dorilar', 'Препаратов в каталоге'), s.katalog],
    [L('Faol bronlar', 'Активных броней'), s.faolBronlar],
  ]
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map(([label, v]) => (
          <div key={label} className="rounded-2xl bg-surface-muted border border-slate-100 p-4">
            <div className="text-2xl font-extrabold text-brand">{(v ?? 0).toLocaleString('ru-RU')}</div>
            <div className="text-xs font-semibold text-ink-dim mt-1">{label}</div>
          </div>
        ))}
      </div>
      {ombor && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            [L('Jami kelgan', 'Всего поступило'), som(ombor.jamiKelgan)],
            [L('Jami sotilgan', 'Всего продано'), som(ombor.jamiSotilgan)],
            [L('Qoldiq', 'Остаток'), som(ombor.jamiQoldiq)],
            [L("Tushum, so'm", 'Выручка, сум'), som(ombor.jamiTushum)],
          ].map(([label, v]) => (
            <div key={label} className="rounded-2xl border border-slate-100 p-4">
              <div className="text-lg font-extrabold text-ink">{v}</div>
              <div className="text-xs font-semibold text-ink-dim mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const OYLAR = [1, 3, 6, 12]

function DorixonalarTab({ onMahsulotlar }: { onMahsulotlar: (id: number) => void }) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [rows, setRows] = useState<DorixonaRow[] | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [xabar, setXabar] = useState<{ ok: boolean; text: string } | null>(null)
  const load = () => { authJson<DorixonaRow[]>('/api/admin/dorixonalar').then(setRows).catch(() => setRows([])) }
  useEffect(load, [])
  const notify = (ok: boolean, text: string) => { setXabar({ ok, text }); window.setTimeout(() => setXabar(null), 4000) }

  if (!rows) return <Spinner />
  return (
    <div>
      <Button size="sm" className="mb-3" onClick={() => setShowAdd((v) => !v)}>
        <Plus className="w-4 h-4" /> {L("Dorixona qo'shish", 'Добавить аптеку')}
      </Button>
      {xabar && <p className={`mb-3 text-sm font-semibold rounded-xl px-3 py-2 ${xabar.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{xabar.text}</p>}
      {showAdd && (
        <DorixonaForma
          withContract
          onCancel={() => setShowAdd(false)}
          onSave={async (f) => {
            await authJson('/api/admin/dorixona', { method: 'POST', body: JSON.stringify(f) })
            setShowAdd(false)
            notify(true, L("Dorixona qo'shildi", 'Аптека добавлена'))
            load()
          }}
        />
      )}
      {rows.length === 0 ? (
        <p className="text-ink-dim text-center py-8">{L("Dorixona yo'q", 'Аптек нет')}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((r) => <DorixonaQator key={r.id} r={r} onChanged={load} notify={notify} onMahsulotlar={onMahsulotlar} />)}
        </div>
      )}
    </div>
  )
}

function obunaMatni(r: { shartnoma_tugash: string | null; holat: string | null }, L: (uz: string, ru: string) => string) {
  if ((r.holat || '').toLowerCase() === 'nofaol') return { text: L('Nofaol', 'Неактивна'), cls: 'text-red-600' }
  if (!r.shartnoma_tugash) return { text: L('Muddatsiz', 'Без срока'), cls: 'text-ink-dim' }
  const tugash = new Date(r.shartnoma_tugash)
  const kun = Math.ceil((tugash.getTime() - Date.now()) / 86400000)
  if (kun < 0) return { text: L(`Muddati tugagan (${r.shartnoma_tugash})`, `Срок истёк (${r.shartnoma_tugash})`), cls: 'text-red-600' }
  return { text: L(`${r.shartnoma_tugash} gacha (${kun} kun)`, `до ${r.shartnoma_tugash} (${kun} дн.)`), cls: kun <= 7 ? 'text-amber-700' : 'text-green-700' }
}

function DorixonaQator({ r, onChanged, notify, onMahsulotlar }: {
  r: DorixonaRow
  onChanged: () => void
  notify: (ok: boolean, text: string) => void
  onMahsulotlar: (id: number) => void
}) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [rejim, setRejim] = useState<null | 'uzaytir' | 'tahrir' | 'ochir'>(null)
  const [busy, setBusy] = useState(false)
  const ob = obunaMatni(r, L)

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true)
    try { await fn(); notify(true, okText); setRejim(null); onChanged() }
    catch (e) { notify(false, (e as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-ink">{r.nomi} <span className="text-xs text-ink-faint font-normal">ID {r.id}</span></div>
          <div className="text-xs text-ink-dim mt-0.5">
            {[r.viloyat, r.tuman, r.manzil].filter(Boolean).join(', ') || '—'}{r.telefon ? ` · ${r.telefon}` : ''}
            {r.ish_boshlanishi && r.ish_tugashi ? ` · ${r.ish_boshlanishi}–${r.ish_tugashi}` : ''}
          </div>
          <div className="text-xs mt-0.5">
            <span className={ob.cls}>{L('Obuna', 'Подписка')}: {ob.text}</span>
            <span className="text-ink-dim"> · {r.egasi_telegram_id
              ? L(`Egasi: ${r.egasi_ismi || r.egasi_telegram_id}${r.egasi_telefon ? ' (' + r.egasi_telefon + ')' : ''}`, `Владелец: ${r.egasi_ismi || r.egasi_telegram_id}${r.egasi_telefon ? ' (' + r.egasi_telefon + ')' : ''}`)
              : L('egasi ulanmagan', 'владелец не подключён')}</span>
            <span className="text-ink-dim"> · {L(`${r.dorilar_soni} ta mahsulot`, `товаров: ${r.dorilar_soni}`)}{r.faol_bronlar ? L(` · ${r.faol_bronlar} faol bron`, ` · активных броней: ${r.faol_bronlar}`) : ''}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => onMahsulotlar(r.id)}><Pill className="w-3.5 h-3.5" /> {L('Mahsulotlar', 'Товары')}</Button>
          <Button size="sm" variant="secondary" onClick={() => setRejim(rejim === 'uzaytir' ? null : 'uzaytir')}><CalendarPlus className="w-3.5 h-3.5" /> {L('Uzaytirish', 'Продлить')}</Button>
          <Button size="sm" variant="secondary" onClick={() => setRejim(rejim === 'tahrir' ? null : 'tahrir')}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="secondary" onClick={() => setRejim(rejim === 'ochir' ? null : 'ochir')}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
        </div>
      </div>

      {rejim === 'uzaytir' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-dim">{L('Necha oyga?', 'На сколько месяцев?')}</span>
          {OYLAR.map((m) => (
            <Button key={m} size="sm" disabled={busy}
              onClick={() => run(() => authJson(`/api/admin/dorixona/${r.id}/uzaytir`, { method: 'POST', body: JSON.stringify({ oylar: String(m) }) }),
                L(`Obuna ${m} oyga uzaytirildi`, `Подписка продлена на ${m} мес.`))}>
              {L(`${m} oy`, `${m} мес.`)}
            </Button>
          ))}
        </div>
      )}
      {rejim === 'tahrir' && (
        <div className="mt-2">
          <DorixonaForma
            initial={r}
            onCancel={() => setRejim(null)}
            onSave={(f) => run(() => authJson(`/api/admin/dorixona/${r.id}`, { method: 'PUT', body: JSON.stringify(f) }), L('Saqlandi', 'Сохранено'))}
          />
        </div>
      )}
      {rejim === 'ochir' && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 px-3 py-2">
          <span className="text-sm text-red-700">{L("Dorixona barcha mahsulotlari, bronlari va arizalari bilan o'chiriladi. Rostdanmi?", 'Аптека удалится со всеми товарами, бронями и заявками. Точно?')}</span>
          <Button size="sm" variant="destructive" disabled={busy}
            onClick={() => run(() => authJson(`/api/admin/dorixona/${r.id}`, { method: 'DELETE' }), L("Dorixona o'chirildi", 'Аптека удалена'))}>
            {L("Ha, o'chirish", 'Да, удалить')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setRejim(null)}>{L("Yo'q", 'Нет')}</Button>
        </div>
      )}
    </div>
  )
}

function DorixonaForma({ initial, withContract, onSave, onCancel }: {
  initial?: Partial<DorixonaRow>
  withContract?: boolean
  onSave: (f: Record<string, string>) => Promise<void>
  onCancel: () => void
}) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [f, setF] = useState<Record<string, string>>({
    nomi: initial?.nomi || '',
    viloyat: initial?.viloyat || '',
    tuman: initial?.tuman || '',
    manzil: initial?.manzil || '',
    telefon: initial?.telefon || '',
    ishBoshlanishi: initial?.ish_boshlanishi || '',
    ishTugashi: initial?.ish_tugashi || '',
    oylar: '1',
  })
  const [xato, setXato] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const save = async () => {
    if (!f.nomi.trim()) { setXato(L('Dorixona nomi kerak', 'Нужно название аптеки')); return }
    setSaving(true); setXato('')
    try { await onSave(f) } catch (e) { setXato((e as Error).message) } finally { setSaving(false) }
  }
  return (
    <div className="mb-3 p-4 rounded-2xl bg-brand/5 border border-brand/20 grid gap-3 sm:grid-cols-2">
      <input className={inputCls} placeholder={L('Dorixona nomi *', 'Название аптеки *')} value={f.nomi} onChange={set('nomi')} />
      <input className={inputCls} placeholder={L('Telefon', 'Телефон')} value={f.telefon} onChange={set('telefon')} />
      <input className={inputCls} placeholder={L('Viloyat', 'Область')} value={f.viloyat} onChange={set('viloyat')} />
      <input className={inputCls} placeholder={L('Tuman', 'Район')} value={f.tuman} onChange={set('tuman')} />
      <input className={inputCls + ' sm:col-span-2'} placeholder={L('Manzil', 'Адрес')} value={f.manzil} onChange={set('manzil')} />
      <div className="flex gap-2">
        <input className={inputCls} placeholder={L('Ochilish (08:00)', 'Открытие (08:00)')} value={f.ishBoshlanishi} onChange={set('ishBoshlanishi')} />
        <input className={inputCls} placeholder={L('Yopilish (22:00)', 'Закрытие (22:00)')} value={f.ishTugashi} onChange={set('ishTugashi')} />
      </div>
      {withContract && (
        <select className={inputCls} value={f.oylar} onChange={set('oylar')}>
          {OYLAR.map((m) => <option key={m} value={m}>{L(`Shartnoma: ${m} oy`, `Договор: ${m} мес.`)}</option>)}
        </select>
      )}
      {xato && <p className="text-sm text-red-600 sm:col-span-2">{xato}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button size="sm" variant="success" disabled={saving} onClick={save}><Check className="w-4 h-4" /> {L('Saqlash', 'Сохранить')}</Button>
        <Button size="sm" variant="secondary" onClick={onCancel}><X className="w-4 h-4" /> {L('Bekor', 'Отмена')}</Button>
      </div>
    </div>
  )
}

function DorilarTab({ dxId, setDxId }: { dxId: number | null; setDxId: (id: number) => void }) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [rows, setRows] = useState<DorixonaRow[]>([])
  const [hisobot, setHisobot] = useState<Hisobot | null>(null)
  useEffect(() => {
    authJson<DorixonaRow[]>('/api/admin/dorixonalar').then((r) => {
      setRows(r)
      if (dxId == null && r.length) setDxId(r[0].id)
    }).catch(() => setRows([]))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const api = useMemo(() => (dxId == null ? null : adminDoriApi(dxId)), [dxId])
  const loadHisobot = () => { if (api) api.hisobot().then(setHisobot).catch(() => setHisobot(null)) }
  useEffect(() => { setHisobot(null); loadHisobot() }, [api]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <label className="text-sm font-semibold text-ink-dim block mb-1">{L('Dorixona', 'Аптека')}</label>
      <select className={inputCls + ' mb-4'} value={dxId ?? ''} onChange={(e) => setDxId(Number(e.target.value))}>
        {rows.map((r) => <option key={r.id} value={r.id}>{r.nomi} (ID {r.id})</option>)}
      </select>
      {hisobot && <HisobotQisqa h={hisobot} />}
      {api ? <DoriBoshqaruv api={api} onChanged={loadHisobot} /> : <p className="text-ink-dim text-center py-8">{L("Avval dorixona qo'shing", 'Сначала добавьте аптеку')}</p>}
    </div>
  )
}

interface Ariza {
  id: number
  dorixonaId: number
  dorixonaNomi: string
  telegramId: number
  ism: string | null
  username: string | null
  telefon: string | null
  tekshiruvKodi: string | null
  sana: string | null
}

function ArizalarTab() {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [rows, setRows] = useState<Ariza[] | null>(null)
  const [xabar, setXabar] = useState<{ ok: boolean; text: string } | null>(null)
  const load = () => { authJson<Ariza[]>('/api/admin/soov').then(setRows).catch(() => setRows([])) }
  useEffect(load, [])
  const qaror = async (id: number, q: 'tasdiq' | 'rad') => {
    try {
      const r = await authJson<{ ogohlantirish?: string }>(`/api/admin/soov/${id}/${q}`, { method: 'POST' })
      setXabar({ ok: !r.ogohlantirish, text: r.ogohlantirish || (q === 'tasdiq'
        ? L("Tasdiqlandi — egasiga bot orqali xabar boradi.", 'Подтверждено — владелец получит уведомление в боте.')
        : L('Rad etildi.', 'Отклонено.')) })
    } catch (e) {
      setXabar({ ok: false, text: (e as Error).message })
    }
    load()
  }
  if (!rows) return <Spinner />
  return (
    <div>
      {xabar && <p className={`mb-3 text-sm font-semibold rounded-xl px-3 py-2 ${xabar.ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800'}`}>{xabar.text}</p>}
      {rows.length === 0 ? (
        <p className="text-ink-dim text-center py-8">{L("Yangi ariza yo'q", 'Новых заявок нет')}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((a) => (
            <div key={a.id} className="py-4">
              <div className="font-bold text-ink">№{a.id} · {a.dorixonaNomi}</div>
              <div className="text-xs text-ink-dim mt-0.5">
                {a.ism || '—'}{a.username ? ` (@${a.username})` : ''}{a.telefon ? ` · ${a.telefon}` : ''}
                {a.tekshiruvKodi ? ` · ${L('Tekshiruv kodi', 'Проверочный код')}: ${a.tekshiruvKodi}` : ''}
                {a.sana ? ` · ${new Date(a.sana).toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')}` : ''}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <ArizaRasm id={a.id} turi="litsenziya" label={L('Litsenziya', 'Лицензия')} />
                <ArizaRasm id={a.id} turi="jonli" label={L('Jonli surat (kod bilan)', 'Живое фото (с кодом)')} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="success" onClick={() => qaror(a.id, 'tasdiq')}><Check className="w-4 h-4" /> {L('Tasdiqlash', 'Подтвердить')}</Button>
                <Button size="sm" variant="destructive" onClick={() => qaror(a.id, 'rad')}><X className="w-4 h-4" /> {L('Rad etish', 'Отклонить')}</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Ariza surati — token bilan yuklab, brauzerda vaqtinchalik manzil orqali ko'rsatiladi. */
function ArizaRasm({ id, turi, label }: { id: number; turi: string; label: string }) {
  const [src, setSrc] = useState<string | null>(null)
  const [yoq, setYoq] = useState(false)
  useEffect(() => {
    let url: string | null = null
    const token = localStorage.getItem('token')
    fetch(`/api/admin/soov/${id}/rasm/${turi}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) => { url = URL.createObjectURL(b); setSrc(url) })
      .catch(() => setYoq(true))
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [id, turi])
  if (yoq) return null
  return (
    <a href={src || undefined} target="_blank" rel="noreferrer" className="block">
      <div className="text-[11px] font-semibold text-ink-dim mb-1">{label}</div>
      {src ? <img src={src} alt={label} className="w-40 h-40 object-cover rounded-xl border border-slate-200" />
        : <div className="w-40 h-40 rounded-xl bg-slate-100 animate-pulse" />}
    </a>
  )
}

interface UserRow { id: number; name: string | null; phoneNumber: string | null; createdAt: string | null; lastLoginAt: string | null }

function UsersTab() {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [rows, setRows] = useState<UserRow[] | null>(null)
  const [q, setQ] = useState('')
  useEffect(() => { authJson<UserRow[]>('/api/admin/users').then(setRows).catch(() => setRows([])) }, [])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const all = (rows || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    return s ? all.filter((u) => [u.name, u.phoneNumber, String(u.id)].some((v) => (v || '').toLowerCase().includes(s))) : all
  }, [rows, q])
  if (!rows) return <Spinner />
  return (
    <div>
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
        <input className={inputCls + ' pl-9'} placeholder={L('Ism, telefon yoki ID', 'Имя, телефон или ID')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="text-xs text-ink-faint mb-2">{L(`Jami: ${list.length}`, `Всего: ${list.length}`)}</p>
      <div className="divide-y divide-slate-100">
        {list.map((u) => (
          <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-ink text-sm truncate">{u.name || '—'}</div>
              <div className="text-xs text-ink-dim">{u.phoneNumber || L("telefon yo'q", 'нет телефона')}</div>
            </div>
            <div className="text-right text-[11px] text-ink-faint flex-shrink-0">
              <div>ID {u.id}</div>
              {u.createdAt && <div>{new Date(u.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Spinner() {
  return <div className="flex justify-center py-8"><div className="w-6 h-6 border-[3px] border-brand/30 border-t-brand rounded-full animate-spin" /></div>
}
