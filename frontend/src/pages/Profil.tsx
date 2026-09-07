import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, FileText, ShoppingCart, LogOut, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLang } from '@/hooks/useLanguage'
import { getProfile, getBronlar, adminCheck, type UserProfile, type BronItem } from '@/lib/api'

export function Profil() {
  const { lang, t } = useLang()
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const [user, setUser] = useState<UserProfile | null>(null)
  const [bronlar, setBronlar] = useState<BronItem[]>([])
  const [bronLoading, setBronLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    getProfile(token)
      .then((u) => {
        setUser(u)
        if (u.name) localStorage.setItem('userName', u.name)
        setBronLoading(true)
        return getBronlar(token)
      })
      .then((b) => setBronlar(b || []))
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
        setBronLoading(false)
      })
    adminCheck(token).then((d) => setIsAdmin(d.admin)).catch(() => {})
  }, [token])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    navigate('/')
  }

  if (loading) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
      </section>
    )
  }

  if (!token || !user) {
    return (
      <section className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-sea to-brand flex items-center justify-center mx-auto shadow-[0_14px_30px_rgba(37,99,235,0.35)] mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-ink mb-2">{t('profil')}</h2>
          <p className="text-ink-dim mb-6">{t('kirishTaklif')}</p>
          <Button onClick={() => navigate('/login')}>
            {t('kirish')}
          </Button>
        </div>
      </section>
    )
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—'

  return (
    <section className="max-w-[800px] mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-[110px] h-[110px] rounded-full bg-gradient-to-br from-brand-sea to-brand flex items-center justify-center mx-auto shadow-[0_14px_30px_rgba(37,99,235,0.35)]">
          <User className="w-14 h-14 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-ink mt-4">
          {user.name || t('foydalanuvchi')}
        </h1>
        <p className="text-ink-dim font-semibold mt-1">{user.phoneNumber}</p>
      </div>

      <Card className="p-6 mb-4">
        <h3 className="font-bold text-ink text-lg flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-brand" />
          </div>
          {t('shaxsiyMalumot')}
        </h3>
        <div className="divide-y divide-slate-100">
          <InfoRow label={t('ism')} value={user.name || t('foydalanuvchi')} />
          <InfoRow label={t('telefon').replace(':', '')} value={user.phoneNumber} />
          <InfoRow label={t('royxatdanOtgan')} value={joinDate} />
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <h3 className="font-bold text-ink text-lg flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-brand" />
          </div>
          {t('meningBandlarim')}
        </h3>
        {bronLoading ? (
          <p className="text-ink-dim text-sm">{t('bronlarYuklanmoqda')}</p>
        ) : bronlar.length === 0 ? (
          <p className="text-ink-dim text-sm">{t('bronlarYoq')}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {bronlar.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Pill className="w-4 h-4 text-brand flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-ink text-sm truncate">{b.doriNomi}</div>
                    <div className="text-ink-dim text-xs">{b.dorixonaNomi} · {b.soni} {b.tur}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-sm font-bold text-brand">{b.kod}</div>
                  <div className="text-xs text-ink-faint">{b.sana}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isAdmin && (
        <Link to="/admin">
          <Button variant="secondary" className="w-full mb-4">
            {t('adminPanel')}
          </Button>
        </Link>
      )}

      <Button
        variant="destructive"
        className="w-full"
        onClick={logout}
      >
        <LogOut className="w-4 h-4" />
        {t('chiqish')}
      </Button>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3">
      <span className="text-ink-dim">{label}</span>
      <span className="text-ink font-semibold">{value}</span>
    </div>
  )
}
