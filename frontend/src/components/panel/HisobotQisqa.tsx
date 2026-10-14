import { useLang } from '@/hooks/useLanguage'
import { som, type Hisobot } from '@/lib/panel'

/** Ombor hisobotining qisqa ko'rinishi (botdagi "📈 Hisobot" jamlanmasi). */
export function HisobotQisqa({ h }: { h: Hisobot }) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
      {[
        [L('Mahsulot turi', 'Видов товара'), h.turlarSoni],
        [L('Kelgan', 'Поступило'), h.jamiKelgan],
        [L('Sotilgan', 'Продано'), h.jamiSotilgan],
        [L('Qoldiq', 'Остаток'), h.jamiQoldiq],
        [L("Tushum, so'm", 'Выручка, сум'), som(h.jamiTushum)],
      ].map(([label, v]) => (
        <div key={String(label)} className="rounded-xl border border-slate-100 bg-surface-muted px-3 py-2">
          <div className="text-base font-extrabold text-ink">{typeof v === 'number' ? v.toLocaleString('ru-RU') : v}</div>
          <div className="text-[11px] font-semibold text-ink-dim">{label}</div>
        </div>
      ))}
    </div>
  )
}
