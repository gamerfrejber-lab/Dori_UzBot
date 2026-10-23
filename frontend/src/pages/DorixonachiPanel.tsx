import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Pill, ShoppingCart, FileText, Check, CalendarDays, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLang } from '@/hooks/useLanguage'
import { cn } from '@/lib/utils'
import { authJson, ownerDoriApi, type Hisobot } from '@/lib/panel'
import { DoriBoshqaruv } from '@/components/panel/DoriBoshqaruv'
import { YetkazishBoshqaruv } from '@/components/panel/YetkazishBoshqaruv'
import { BronlarRoyxati } from '@/components/panel/BronlarRoyxati'
import { HisobotQisqa } from '@/components/panel/HisobotQisqa'
import { JoylashuvMaydoni } from '@/components/panel/JoylashuvMaydoni'

type Tab = 'dorilar' | 'bronlar' | 'yetkazish' | 'obuna' | 'malumot'

interface DorixonaInfo {
  id: number
  name: string
  address: string
  telefon: string
  ishBoshlanishi: string | null
  ishTugashi: string | null
  latitude?: number | null
  longitude?: number | null
}

export function DorixonachiPanel() {
  const { t, lang } = useLang()
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
    { key: 'yetkazish', label: lang === 'ru' ? 'Доставка' : 'Yetkazish', icon: <Truck className="w-4 h-4" /> },
    { key: 'obuna', label: lang === 'ru' ? 'Моя подписка' : 'Obunam', icon: <CalendarDays className="w-4 h-4" /> },
    { key: 'malumot', label: t('dxMalumot'), icon: <FileText className="w-4 h-4" /> },
  ]

  return (
    <section className="max-w-[1100px] mx-auto px-4 py-4 sm:py-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-extrabold text-ink flex items-center gap-2">
          <Building2 className="w-5 sm:w-6 h-5 sm:h-6 text-brand" />
          {dorixona.name}
        </h1>
        <p className="text-ink-dim mt-1 text-sm sm:text-base">{t('dorixonaPanelDesc')}</p>
      </div>

      <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-5 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-all border',
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

      <Card className="p-4 sm:p-6">
        {activeTab === 'dorilar' && <MahsulotlarTab />}
        {activeTab === 'bronlar' && <BronlarRoyxati url="/api/dorixonachi/bronlar" canEdit />}
        {activeTab === 'yetkazish' && <YetkazishBoshqaruv />}
        {activeTab === 'obuna' && <ObunaTab />}
        {activeTab === 'malumot' && <MalumotTab token={token!} dorixona={dorixona} onUpdate={setDorixona} />}
      </Card>
    </section>
  )
}

function MahsulotlarTab() {
  const [hisobot, setHisobot] = useState<Hisobot | null>(null)
  const loadHisobot = () => { ownerDoriApi.hisobot().then(setHisobot).catch(() => setHisobot(null)) }
  useEffect(loadHisobot, [])
  return (
    <div>
      {hisobot && <HisobotQisqa h={hisobot} />}
      <DoriBoshqaruv api={ownerDoriApi} onChanged={loadHisobot} />
    </div>
  )
}

/** Botdagi "🗓 Obunam": shartnoma muddati va holati. */
function ObunaTab() {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [o, setO] = useState<{ boshlanish: string | null; tugash: string | null; holat: string | null; kunlarQoldi: number | null } | null>(null)
  useEffect(() => { authJson('/api/dorixonachi/obuna').then(setO).catch(() => setO(null)) }, [])
  if (!o) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-[3px] border-brand/30 border-t-brand rounded-full animate-spin" /></div>
  const tugagan = o.kunlarQoldi != null && o.kunlarQoldi < 0
  return (
    <div className="space-y-3">
      <div className={`rounded-2xl p-4 ${tugagan ? 'bg-red-50' : 'bg-green-50'}`}>
        <div className={`text-lg font-extrabold ${tugagan ? 'text-red-700' : 'text-green-700'}`}>
          {o.tugash == null
            ? L('Obuna muddatsiz', 'Подписка без срока')
            : tugagan
              ? L(`Obuna ${o.tugash} da tugagan`, `Подписка истекла ${o.tugash}`)
              : L(`Obuna ${o.tugash} gacha faol (${o.kunlarQoldi} kun qoldi)`, `Подписка активна до ${o.tugash} (осталось ${o.kunlarQoldi} дн.)`)}
        </div>
        {o.boshlanish && <div className="text-sm text-ink-dim mt-1">{L('Boshlangan', 'Начало')}: {o.boshlanish}</div>}
      </div>
      <p className="text-sm text-ink-dim">
        {L("Obuna tugasa, dorilaringiz qidiruvda ko'rinmay qoladi. Uzaytirish uchun adminga murojaat qiling.",
          'Когда подписка истекает, ваши товары не показываются в поиске. Для продления обратитесь к администратору.')}
      </p>
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
  const [joy, setJoy] = useState<{ lat: number | null; lng: number | null }>({
    lat: dorixona.latitude ?? null,
    lng: dorixona.longitude ?? null,
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
        body: JSON.stringify({ ...form, latitude: joy.lat, longitude: joy.lng }),
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
      <JoylashuvMaydoni lat={joy.lat} lng={joy.lng} onChange={(lat, lng) => setJoy({ lat, lng })} />
      <div className="flex items-center gap-3">
        <Button variant="success" onClick={handleSave} disabled={saving}>
          <Check className="w-4 h-4" /> {saving ? '...' : t('dxSaqlash')}
        </Button>
        {saved && <span className="text-green-600 text-sm font-semibold">{t('dxSaqlandi')}</span>}
      </div>
    </div>
  )
}
