import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLang } from '@/hooks/useLanguage'
import { verifyCode, sendCode } from '@/lib/api'

function formatPhoneDisplay(value: string): string {
  const digits = (value || '').replace(/\D/g, '')
  if (digits.startsWith('998') && digits.length === 12) {
    const n = digits.slice(3)
    return '+998 ' + n.slice(0, 2) + ' ' + n.slice(2, 5) + ' ' + n.slice(5, 7) + ' ' + n.slice(7)
  }
  if (digits.startsWith('7') && digits.length === 11) {
    const n = digits.slice(1)
    return '+7 ' + n.slice(0, 3) + ' ' + n.slice(3, 6) + ' ' + n.slice(6, 8) + ' ' + n.slice(8)
  }
  return value
}

export function SmsVerify() {
  const { t } = useLang()
  const navigate = useNavigate()
  const phone = localStorage.getItem('phone') || ''
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendStatus, setResendStatus] = useState<string | null>(null)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!phone) navigate('/login')
    else inputsRef.current[0]?.focus()
  }, [phone, navigate])

  const handleChange = (index: number, value: string) => {
    if (!value.match(/[0-9]/) && value !== '') return
    const next = [...code]
    next[index] = value.slice(-1)
    setCode(next)
    setError('')
    if (value && index < 5) inputsRef.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputsRef.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...code]
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setCode(next)
    const last = Math.min(pasted.length, 5)
    inputsRef.current[last]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError(t('barchaRaqam'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await verifyCode(phone, fullCode)
      if (data.token) {
        localStorage.setItem('token', data.token)
        navigate('/')
      } else {
        setError(data.message || t('notogrriKod'))
      }
    } catch {
      setError(t('serverXato'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendStatus('...')
    try {
      await sendCode(phone)
      setResendStatus(t('yuborildi') + ' ✓')
    } catch {
      setResendStatus(t('serverXato'))
    }
    setTimeout(() => setResendStatus(null), 3000)
  }

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-sea to-brand flex items-center justify-center mx-auto shadow-[0_10px_24px_rgba(37,99,235,0.35)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink mt-4">{t('smsTitle')}</h1>
          <p className="text-ink-dim mt-1">{t('smsDesc')}</p>
          <p className="text-brand font-bold mt-2">{formatPhoneDisplay(phone)}</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl border border-slate-200 bg-white text-center text-2xl font-bold outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('tekshirilmoqda') : t('tasdiqlash')}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={!!resendStatus}
              className="text-sm text-ink-dim hover:text-brand transition-colors disabled:opacity-50"
            >
              {resendStatus || t('qaytaYuborish')}
            </button>
            <br />
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-ink-faint hover:text-brand transition-colors"
            >
              ← {t('orqaga')}
            </button>
          </div>
        </Card>
      </div>
    </section>
  )
}
