import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Building2, Pill, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLang } from '@/hooks/useLanguage'
import { adminCheck, adminStats } from '@/lib/api'
import { cn } from '@/lib/utils'

type Tab = 'pharmacies' | 'drugs' | 'catalog' | 'users'

export function Admin() {
  const { t } = useLang()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState<Tab>('pharmacies')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }
    adminCheck(token)
      .then((data) => {
        setIsAdmin(data.admin)
        if (data.admin) {
          adminStats(token).then(setStats).catch(() => {})
        }
      })
      .catch(() => setIsAdmin(false))
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
          <h2 className="text-xl font-extrabold text-ink mb-2">{t('ruxsatYoq')}</h2>
          <p className="text-ink-dim mb-6">{t('ruxsatYoqDesc')}</p>
          <Button onClick={() => navigate('/')}>
            {t('boshSahifagaQaytish')}
          </Button>
        </div>
      </section>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'pharmacies', label: t('adminDorixonalar'), icon: <Building2 className="w-4 h-4" /> },
    { key: 'drugs', label: t('adminDorilar'), icon: <Pill className="w-4 h-4" /> },
    { key: 'catalog', label: t('adminKatalog'), icon: <Search className="w-4 h-4" /> },
    { key: 'users', label: t('adminFoydalanuvchilar'), icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <section className="max-w-[1100px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink flex items-center gap-2">
          <Shield className="w-6 h-6 text-brand" />
          {t('adminPanel')}
        </h1>
        <p className="text-ink-dim mt-1">{t('adminDesc')}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label={t('adminDorixonalar')} value={stats.pharmacies ?? '—'} />
        <StatCard label={t('adminDorilar')} value={stats.drugs ?? '—'} />
        <StatCard label={t('adminKatalog')} value={stats.katalog ?? '—'} />
        <StatCard label={t('adminFoydalanuvchilar')} value={stats.users ?? '—'} />
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
        <AdminTabContent tab={activeTab} token={token!} />
      </Card>
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4 text-center">
      <div className="text-2xl font-extrabold text-brand">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-ink-dim text-sm font-semibold mt-1">{label}</div>
    </Card>
  )
}

function AdminTabContent({ tab, token }: { tab: Tab; token: string }) {
  const { lang } = useLang()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const endpoints: Record<Tab, string> = {
      pharmacies: '/api/dorixona',
      drugs: '/api/dori',
      catalog: '/api/katalog/qidirish?q=&limit=50',
      users: '/api/admin/users',
    }
    fetch(endpoints[tab], { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [tab, token])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-3 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    )
  }

  if (data.length === 0) {
    return <p className="text-ink-dim text-center py-8">{lang === 'uz' ? "Ma'lumot topilmadi" : 'Данные не найдены'}</p>
  }

  if (tab === 'pharmacies') {
    return (
      <div className="divide-y divide-slate-100">
        {data.map((ph: any) => (
          <div key={ph.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-ink">{ph.nomi || ph.name}</div>
              <div className="text-sm text-ink-dim">{ph.manzil || ph.address} · {ph.telefon}</div>
            </div>
            <span className="text-xs text-ink-faint">ID: {ph.id}</span>
          </div>
        ))}
      </div>
    )
  }

  if (tab === 'drugs') {
    return (
      <div className="divide-y divide-slate-100">
        {data.map((d: any) => (
          <div key={d.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-ink">{d.nomi || d.name}</div>
              <div className="text-sm text-ink-dim">{d.dorixonaNomi || ''} · {(d.narx || d.price || 0).toLocaleString()} so'm</div>
            </div>
            <span className="text-xs text-ink-faint">ID: {d.id}</span>
          </div>
        ))}
      </div>
    )
  }

  if (tab === 'catalog') {
    return (
      <div className="divide-y divide-slate-100">
        {data.map((item: any) => (
          <div key={item.id} className="py-3">
            <div className="font-semibold text-ink">{item.nomi}</div>
            <div className="text-sm text-ink-dim">{item.ishlabChiqaruvchi || ''} · {item.davlat || ''}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {data.map((u: any) => (
        <div key={u.id} className="py-3 flex items-center justify-between">
          <div>
            <div className="font-semibold text-ink">{u.name || u.phoneNumber}</div>
            <div className="text-sm text-ink-dim">{u.phoneNumber} · {u.role || 'USER'}</div>
          </div>
          <span className="text-xs text-ink-faint">ID: {u.id}</span>
        </div>
      ))}
    </div>
  )
}
