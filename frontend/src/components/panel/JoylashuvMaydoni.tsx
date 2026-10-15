import { useState } from 'react'
import { LocateFixed, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLanguage'
import { koordinataAjrat } from '@/lib/xarita'

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-brand/30'

/**
 * Dorixonaning xaritadagi joyi: koordinatani yoki Google/Yandex xarita havolasini qo'yish,
 * yoki dorixonada turib "Hozirgi joyim" tugmasini bosish mumkin.
 */
export function JoylashuvMaydoni({ lat, lng, onChange }: {
  lat: number | null
  lng: number | null
  onChange: (lat: number | null, lng: number | null) => void
}) {
  const { lang } = useLang()
  const L = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
  const [matn, setMatn] = useState(lat && lng ? `${lat}, ${lng}` : '')
  const [xato, setXato] = useState('')
  const [kutish, setKutish] = useState(false)

  const ozgardi = (v: string) => {
    setMatn(v)
    if (!v.trim()) { setXato(''); onChange(null, null); return }
    const k = koordinataAjrat(v)
    if (k) { setXato(''); onChange(k.lat, k.lng) }
    else setXato(L('Koordinata yoki xarita havolasini qo\'ying (masalan: 41.3612, 69.2846)', 'Вставьте координаты или ссылку на карту (например: 41.3612, 69.2846)'))
  }

  const hozirgiJoy = () => {
    if (!navigator.geolocation) { setXato(L("Brauzer joylashuvni bera olmaydi", 'Браузер не даёт геолокацию')); return }
    setKutish(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const la = Math.round(p.coords.latitude * 1e6) / 1e6
        const lo = Math.round(p.coords.longitude * 1e6) / 1e6
        setMatn(`${la}, ${lo}`)
        setXato('')
        onChange(la, lo)
        setKutish(false)
      },
      () => { setXato(L("Joylashuvga ruxsat berilmadi", 'Доступ к геолокации не разрешён')); setKutish(false) },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  return (
    <div className="sm:col-span-2">
      <label className="text-sm font-semibold text-ink-dim block mb-1">{L('Xaritadagi joyi', 'Место на карте')}</label>
      <div className="flex flex-wrap gap-2">
        <input
          className={inputCls + ' flex-1 min-w-[220px]'}
          value={matn}
          onChange={(e) => ozgardi(e.target.value)}
          placeholder={L('41.3612, 69.2846 yoki Google/Yandex xarita havolasi', '41.3612, 69.2846 или ссылка Google/Yandex')}
        />
        <Button type="button" size="sm" variant="secondary" className="h-[38px]" disabled={kutish} onClick={hozirgiJoy}>
          <LocateFixed className="w-4 h-4" /> {kutish ? '...' : L('Hozirgi joyim', 'Моё место')}
        </Button>
      </div>
      {xato
        ? <p className="text-xs text-red-600 mt-1">{xato}</p>
        : lat && lng
          ? <a className="text-xs text-brand font-semibold mt-1 inline-flex items-center gap-1" target="_blank" rel="noreferrer"
              href={`https://yandex.uz/maps/?pt=${lng},${lat}&z=17&l=map`}><MapPin className="w-3 h-3" /> {L('Xaritada tekshirish', 'Проверить на карте')}</a>
          : <p className="text-xs text-ink-faint mt-1">{L('"Hozirgi joyim" — dorixonada turgan holda bosing.', '«Моё место» — нажмите, находясь в аптеке.')}</p>}
    </div>
  )
}
