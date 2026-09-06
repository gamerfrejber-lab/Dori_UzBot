import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Send, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLang } from '@/hooks/useLanguage'
import { sendCode } from '@/lib/api'

type Country = 'uz' | 'ru'

const countryConfig = {
  uz: { code: '+998', flag: '🇺🇿', maxDigits: 9, placeholder: '90 123 45 67' },
  ru: { code: '+7', flag: '🇷🇺', maxDigits: 10, placeholder: '912 345 67 89' },
}

function formatPhone(digits: string, country: Country): string {
  if (country === 'uz') {
    const d = digits.slice(0, 9)
    let result = ''
    if (d.length > 0) result += d.slice(0, 2)
    if (d.length > 2) result += ' ' + d.slice(2, 5)
    if (d.length > 5) result += ' ' + d.slice(5, 7)
    if (d.length > 7) result += ' ' + d.slice(7, 9)
    return result
  }
  const d = digits.slice(0, 10)
  let result = ''
  if (d.length > 0) result += d.slice(0, 3)
  if (d.length > 3) result += ' ' + d.slice(3, 6)
  if (d.length > 6) result += ' ' + d.slice(6, 8)
  if (d.length > 8) result += ' ' + d.slice(8, 10)
  return result
}

export function Login() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [country, setCountry] = useState<Country>('uz')
  const [digits, setDigits] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cfg = countryConfig[country]
  const fullPhone = cfg.code + digits

  const handleInput = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, cfg.maxDigits)
    setDigits(raw)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (digits.length < cfg.maxDigits) return
    setLoading(true)
    setError('')
    try {
      await sendCode(fullPhone)
      localStorage.setItem('phone', fullPhone)
      navigate('/sms')
    } catch {
      setError(t('serverXato'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-brand-sea to-brand flex items-center justify-center mx-auto shadow-[0_10px_24px_rgba(37,99,235,0.35)]">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink mt-4">{t('loginTitle')}</h1>
          <p className="text-ink-dim mt-1">{t('loginDesc')}</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <label className="text-sm font-semibold text-ink-dim block mb-2">
              {t('telefonRaqam')}
            </label>
            <div className="flex gap-2 mb-4">
              <select
                value={country}
                onChange={(e) => { setCountry(e.target.value as Country); setDigits('') }}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-brand/30"
              >
                <option value="uz">{countryConfig.uz.flag} {countryConfig.uz.code}</option>
                <option value="ru">{countryConfig.ru.flag} {countryConfig.ru.code}</option>
              </select>
              <input
                type="tel"
                value={formatPhone(digits, country)}
                onChange={(e) => handleInput(e.target.value)}
                placeholder={cfg.placeholder}
                autoFocus
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-base outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-3">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || digits.length < cfg.maxDigits}
            >
              <Send className="w-4 h-4" />
              {loading ? t('yuborilmoqda') : t('smsKodYuborish')}
            </Button>
          </form>

          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2">
            <MessageCircle className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink-dim">{t('telegramHint')}</p>
          </div>
        </Card>
      </div>
    </section>
  )
}
