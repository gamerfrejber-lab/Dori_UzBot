import { useEffect, useState } from 'react'
import { Search, Pill } from 'lucide-react'
import { SearchBox } from '@/components/SearchBox'
import { Badge } from '@/components/ui/badge'
import { useLang } from '@/hooks/useLanguage'
import * as api from '@/lib/api'

interface Props {
  onSearch: (query: string) => void
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 900
    const start = performance.now()
    function step(now: number) {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(value * ease))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])

  return <>{display.toLocaleString()}</>
}

const quickTags = ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Aspirin', 'Vitamin C']

export function Hero({ onSearch }: Props) {
  const { t } = useLang()
  const [drugCount, setDrugCount] = useState(0)
  const [pharmCount, setPharmCount] = useState(0)
  const userName = localStorage.getItem('userName')

  useEffect(() => {
    api.katalogSoni().then((d) => setDrugCount(d.jami)).catch(() => {})
    api.dorixonalar().then((d) => setPharmCount(d.length)).catch(() => {})
  }, [])

  return (
    <section className="max-w-[1180px] mx-auto px-4 pt-6 pb-2">
      <div className="animate-fade-up delay-1 grid grid-cols-[1.7fr_1fr] max-[820px]:grid-cols-1 gap-5 items-stretch">
        <div className="bg-gradient-to-br from-blue-50 via-blue-50/40 to-orange-50 border border-slate-100 rounded-[28px] p-6 lg:p-10 shadow-[0_12px_34px_rgba(2,32,71,0.06)] flex flex-col justify-center">
          <Badge variant="warning" className="self-start gap-1.5 mb-5 px-3 py-1.5">
            <Search className="w-3.5 h-3.5" />
            {t('qidiruvBadge')}
          </Badge>
          <h1 className="text-3xl lg:text-5xl font-extrabold text-ink leading-[1.06] tracking-tight mb-2">
            {t('salom')}{' '}
            <span className="text-brand-ember">{userName || t('mehmon')}!</span>
          </h1>
          <p className="text-xl lg:text-2xl font-extrabold text-ink leading-tight mb-3">
            {t('doriTopish')}{' '}
            <span className="text-brand">{t('endiOson')}</span>
          </p>
          <p className="text-ink-dim text-base max-w-lg">{t('heroDesc')}</p>
        </div>

        <div className="flex flex-col gap-3 max-[820px]:flex-row">
          <StatCard
            value={<AnimatedNumber value={drugCount} />}
            label={t('katalogdaDori')}
          />
          <StatCard
            value={<AnimatedNumber value={pharmCount} />}
            label={t('dorixona')}
            orange
          />
          <StatCard value="24/7" label={t('xizmat')} orange />
        </div>
      </div>

      <div className="animate-fade-up delay-2 mt-5 relative z-50">
        <SearchBox onSearch={onSearch} />
      </div>

      <div className="animate-fade-up delay-3 flex gap-2 flex-wrap mt-4">
        {quickTags.map((tag) => (
          <button
            key={tag}
            onClick={() => onSearch(tag)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-100 rounded-full text-sm font-medium text-ink-dim shadow-[0_4px_12px_rgba(2,32,71,0.04)] hover:-translate-y-0.5 hover:text-brand hover:border-brand/30 hover:shadow-[0_10px_22px_rgba(37,99,235,0.16)] transition-all active:translate-y-0 active:scale-[0.97]"
          >
            <Pill className="w-3.5 h-3.5" />
            {tag}
          </button>
        ))}
      </div>
    </section>
  )
}

function StatCard({
  value,
  label,
  orange,
}: {
  value: React.ReactNode
  label: string
  orange?: boolean
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-[22px] p-4 lg:p-5 shadow-[0_8px_24px_rgba(2,32,71,0.05)] flex-1 flex flex-col justify-center">
      <div
        className={`text-2xl lg:text-3xl font-extrabold leading-none ${
          orange ? 'text-brand-ember' : 'text-brand'
        }`}
      >
        {value}
      </div>
      <div className="text-ink-dim text-sm mt-1 font-medium">{label}</div>
    </div>
  )
}
