import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Pill, ShoppingCart, FileText, Plus, Trash2, Check, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLang } from '@/hooks/useLanguage'
import { cn } from '@/lib/utils'

type Tab = 'dorilar' | 'bronlar' | 'malumot'

interface DorixonaInfo {
  id: number
  name: string
  address: string
  telefon: string
  ishBoshlanishi: string | null
  ishTugashi: string | null
}

export function DorixonachiPanel() {
  const { t } = useLang()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const [dorixona, setDorixona] = useState<DorixonaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('dorilar')

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    fetch('/api/dorixonachi/check', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { egasi: false })
      .then((data) => {
        setIsOwner(data.egasi)
        if (data.egasi) setDorixona(data.dorixona)
      })
      .catch(() => setIsOwner(false))
      .finally(() => setLoading(false))
  }, [token, navigate])

  if (loading) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
      </section>
    )
  }

  if (!isOwner || !dorixona) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-xl font-extrabold text-ink mb-2">{t('dxYoq')}</h2>
          <p className="text-ink-dim mb-6">{t('dxYoqDesc')}</p>
          <Button onClick={() => navigate('/')}>{t('boshSahifagaQaytish')}</Button>
        </div>
      </section>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'dorilar', label: t('dxDorilar'), icon: <Pill className="w-4 h-4" /> },
    { key: 'bronlar', label: t('dxBronlar'), icon: <ShoppingCart className="w-4 h-4" /> },
    { key: 'malumot', label: t('dxMalumot'), icon: <FileText className="w-4 h-4" /> },
  ]

  return (
    <section className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink flex items-center gap-2">
          <Building2 className="w-6 h-6 text-brand" />
          {dorixona.name}
        </h1>
        <p className="text-ink-dim mt-1">{t('dorixonaPanelDesc')}</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border',
              activeTab === tab.key
                ? 'text-white bg-gradient-to-br from-brand-sea to-brand border-transparent shadow-[0_8px_20px_rgba(37,99,235,0.35)]'
                : 'text-ink-dim bg-white border-slate-100 hover:text-brand'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {activeTab === 'dorilar' && <DorilarTab token={token!} />}
        {activeTab === 'bronlar' && <BronlarTab token={token!} />}
        {activeTab === 'malumot' && <MalumotTab token={token!} dorixona={dorixona} onUpdate={setDorixona} />}
      </Card>
    </section>
  )
}

function DorilarTab({ token }: { token: string }) {
  const { lang, t } = useLang()
  const [dorilar, setDorilar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newDori, setNewDori] = useState({ name: '', nameRu: '', price: '', manufacturer: '' })
  const [saving, setSaving] = useState(false)

  const loadDorilar = () => {
    setLoading(true)
    fetch('/api/dorixonachi/dorilar', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then(setDorilar)
      .catch(() => setDorilar([]))
      .finally(() => setLoading(false))
  }

  useEffect(loadDorilar, [token])

  const handleAdd = async () => {
    if (!newDori.name || !newDori.price) return
    setSaving(true)
    try {
      await fetch('/api/dorixonachi/dori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newDori.name,
          nameRu: newDori.nameRu || null,
          price: parseFloat(newDori.price),
          manufacturer: newDori.manufacturer || null,
          available: true,
        }),
      })
      setNewDori({ name: '', nameRu: '', price: '', manufacturer: '' })
      setShowAdd(false)
      loadDorilar()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    await fetch(`/api/dorixonachi/dori/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    loadDorilar()
  }

  const handleExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setSaving(true)
    try {
      const r = await fetch('/api/dorixonachi/dori/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await r.json()
      if (data.ok) loadDorilar()
    } finally {
      setSaving(false)
      e.target.value = ''
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-brand/30 border-t-brand rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4" /> {t('dxDoriQoshish')}
        </Button>
        <label>
          <Button size="sm" variant="secondary" className="cursor-pointer" asChild>
            <span><Upload className="w-4 h-4" /> {t('dxExcelImport')}</span>
          </Button>
          <input type="file" accept=".xlsx,.xls" onChange={handleExcel} className="hidden" />
        </label>
      </div>

      {showAdd && (
        <div className="mb-4 p-4 rounded-2xl bg-brand/5 border border-brand/20 space-y-3">
          <input
            placeholder={lang === 'uz' ? 'Dori nomi *' : 'Название *'}
            value={newDori.name}
            onChange={(e) => setNewDori({ ...newDori, name: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30"
          />
          <input
            placeholder={lang === 'uz' ? 'Ruscha nomi' : 'Название (рус)'}
            value={newDori.nameRu}
            onChange={(e) => setNewDori({ ...newDori, nameRu: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30"
          />
          <div className="flex gap-3">
            <input
              placeholder={lang === 'uz' ? "Narx (so'm) *" : 'Цена *'}
              type="number"
              value={newDori.price}
              onChange={(e) => setNewDori({ ...newDori, price: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30"
            />
            <input
              placeholder={lang === 'uz' ? 'Ishlab chiqaruvchi' : 'Производитель'}
              value={newDori.manufacturer}
              onChange={(e) => setNewDori({ ...newDori, manufacturer: e.target.value })}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="success" onClick={handleAdd} disabled={saving}>
              <Check className="w-4 h-4" /> {t('dxSaqlash')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAdd(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {dorilar.length === 0 ? (
        <p className="text-ink-dim text-center py-8">{t('dorilarTopilmadi')}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {dorilar.map((d: any) => (
            <div key={d.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink text-sm truncate">{d.name}</div>
                <div className="text-xs text-ink-dim">
                  {d.manufacturer || ''} · {(d.price || 0).toLocaleString()} {t('som')}
                  {d.available === false && <span className="text-red-500 ml-2">{t('mavjudEmas')}</span>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(d.id)}
                className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BronlarTab({ token }: { token: string }) {
  const { lang, t } = useLang()
  const [bronlar, setBronlar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadBronlar = () => {
    fetch('/api/dorixonachi/bronlar', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then(setBronlar)
      .catch(() => setBronlar([]))
      .finally(() => setLoading(false))
  }

  useEffect(loadBronlar, [token])

  const updateHolat = async (id: number, holat: string) => {
    await fetch(`/api/dorixonachi/bron/${id}/holat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ holat }),
    })
    loadBronlar()
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-brand/30 border-t-brand rounded-full animate-spin" /></div>
  }

  if (bronlar.length === 0) {
    return <p className="text-ink-dim text-center py-8">{t('dxBronYoq')}</p>
  }

  const holatBadge = (holat: string) => {
    const colors: Record<string, string> = {
      YANGI: 'bg-blue-50 text-blue-700',
      TAYYOR: 'bg-green-50 text-green-700',
      BERILDI: 'bg-slate-100 text-slate-500',
      BEKOR: 'bg-red-50 text-red-500',
      MUDDATI_OTGAN: 'bg-orange-50 text-orange-600',
      TOLOV_KUTILMOQDA: 'bg-yellow-50 text-yellow-700',
      TOLANGAN: 'bg-emerald-50 text-emerald-700',
    }
    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[holat] || 'bg-slate-100 text-slate-600'}`}>
        {holat}
      </span>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {bronlar.map((b: any) => (
        <div key={b.id} className="py-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="font-semibold text-ink">{b.doriNomi}</div>
              <div className="text-sm text-ink-dim">
                {b.mijozIsmi || lang === 'uz' ? 'Mijoz' : 'Клиент'} · {b.mijozTelefon || '—'}
              </div>
              <div className="text-xs text-ink-faint mt-0.5">
                {b.soni} {b.tur} · {lang === 'uz' ? 'Kod' : 'Код'}: <span className="font-bold text-brand">{b.kod}</span>
                {b.sana && ` · ${new Date(b.sana).toLocaleDateString()}`}
              </div>
            </div>
            {holatBadge(b.holat)}
          </div>
          {(b.holat === 'YANGI' || b.holat === 'TOLANGAN') && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="success" onClick={() => updateHolat(b.id, 'TAYYOR')}>
                <Check className="w-3 h-3" /> {t('dxTayyor')}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => updateHolat(b.id, 'BEKOR')}>
                <X className="w-3 h-3" /> {t('dxBekor')}
              </Button>
            </div>
          )}
          {b.holat === 'TAYYOR' && (
            <Button size="sm" className="mt-2" onClick={() => updateHolat(b.id, 'BERILDI')}>
              <Check className="w-3 h-3" /> {t('dxBerildi')}
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

function MalumotTab({ token, dorixona, onUpdate }: { token: string; dorixona: DorixonaInfo; onUpdate: (d: DorixonaInfo) => void }) {
  const { lang, t } = useLang()
  const [form, setForm] = useState({
    name: dorixona.name || '',
    address: dorixona.address || '',
    telefon: dorixona.telefon || '',
    ishBoshlanishi: dorixona.ishBoshlanishi || '',
    ishTugashi: dorixona.ishTugashi || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const r = await fetch('/api/dorixonachi/malumot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (r.ok) {
        const data = await r.json()
        onUpdate(data)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally { setSaving(false) }
  }

  const fields = [
    { key: 'name', label: lang === 'uz' ? 'Dorixona nomi' : 'Название аптеки' },
    { key: 'address', label: t('manzil').replace(':', '') },
    { key: 'telefon', label: t('telefon').replace(':', '') },
    { key: 'ishBoshlanishi', label: lang === 'uz' ? 'Ish boshlanishi' : 'Начало работы' },
    { key: 'ishTugashi', label: lang === 'uz' ? 'Ish tugashi' : 'Конец работы' },
  ]

  return (
    <div className="space-y-4">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="text-sm font-semibold text-ink-dim block mb-1">{label}</label>
          <input
            value={(form as any)[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button variant="success" onClick={handleSave} disabled={saving}>
          <Check className="w-4 h-4" /> {saving ? '...' : t('dxSaqlash')}
        </Button>
        {saved && <span className="text-green-600 text-sm font-semibold">{t('dxSaqlandi')}</span>}
      </div>
    </div>
  )
}
