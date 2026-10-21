import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Dorixona } from '@/lib/api'
import { telHavola, xaritaHavolasi } from '@/lib/xarita'
import { tashqiOch } from '@/lib/telegram'
import { dorixonaOchiqmi } from '@/lib/geo'

const TOSHKENT: L.LatLngExpression = [41.3111, 69.2797]

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Dorixona belgisi: ochiq — ko'k, yopiq — kulrang. */
function belgi(ochiq: boolean) {
  const rang = ochiq ? '#2563EB' : '#94A3B8'
  return L.divIcon({
    className: '',
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36],
    html: `<svg width="34" height="42" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 41C17 41 32 26.5 32 16.5C32 8 25.3 1.5 17 1.5S2 8 2 16.5C2 26.5 17 41 17 41Z" fill="${rang}" stroke="#fff" stroke-width="2.5"/>
      <rect x="11" y="10" width="12" height="12" rx="2" fill="#fff"/>
      <path d="M17 12.5v7M13.5 16h7" stroke="${rang}" stroke-width="2.4" stroke-linecap="round"/>
    </svg>`,
  })
}

const SIZ = L.divIcon({
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#2563EB;border:4px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25),0 2px 6px rgba(15,23,42,.35)"></div>',
})

/**
 * "Dorixonalar" sahifasidagi xarita (OpenStreetMap). Joylashuvi kiritilgan dorixonalar belgi bilan
 * ko'rinadi; foydalanuvchi joyini aniqlasa — ko'k nuqta va eng yaqinlarga moslashadi.
 * Belgini bossa: nomi, manzili, telefoni, "Dorilarini ko'rish" va "Yo'l ko'rsatish".
 */
export default function DorixonalarXaritasi({ pharmacies, userLoc, lang, onOpen, className }: {
  pharmacies: (Dorixona & { _km?: number })[]
  userLoc: { lat: number; lon: number } | null
  lang: 'uz' | 'ru'
  onOpen: (ph: Dorixona) => void
  className?: string
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen
  const listRef = useRef(pharmacies)
  listRef.current = pharmacies
  // Ro'yxat har chizilishda yangi massiv bo'lib keladi — xaritani faqat mazmuni o'zgarganda yangilaymiz,
  // aks holda ochilgan oyna yopilib, xarita boshidan joylashib qolardi.
  const imzo = pharmacies.map((p) => `${p.id}:${p.latitude}:${p.longitude}:${p._km ?? ''}:${p.telefon ?? ''}`).join('|')
  const userLat = userLoc?.lat
  const userLon = userLoc?.lon

  useEffect(() => {
    if (!boxRef.current || mapRef.current) return
    // To'liq ekranli xarita: g'ildirak bilan kattalashtirish, tugmalar o'ng pastda (Yandex'dagidek).
    const map = L.map(boxRef.current, { zoomControl: false, scrollWheelZoom: true }).setView(TOSHKENT, 12)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(map)
    // OpenStreetMap litsenziyasi manbani ko'rsatishni talab qiladi — kichik qilib burchakda qoldiramiz.
    map.attributionControl.setPrefix(false)
    layerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    // Konteyner o'lchami o'zgarsa (sarlavha balandligi, telefon burilishi, Telegram paneli) xarita qayta o'lchanadi —
    // aks holda chetlarda kulrang bo'sh joy qolardi.
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    ro.observe(boxRef.current)
    return () => { ro.disconnect(); map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const L_ = (uz: string, ru: string) => (lang === 'ru' ? ru : uz)
    const nuqtalar: L.LatLng[] = []

    listRef.current.filter((p) => p.latitude && p.longitude).forEach((ph) => {
      const ochiq = dorixonaOchiqmi(ph.ishBoshlanishi, ph.ishTugashi)
      const joy = L.latLng(ph.latitude!, ph.longitude!)
      nuqtalar.push(joy)
      const nomi = esc(ph.nomi || ph.name || '')
      const manzil = esc(ph.manzil || ph.address || '')
      const box = document.createElement('div')
      box.style.minWidth = '200px'
      box.innerHTML = `
        <div style="font-weight:800;font-size:15px;color:#0F172A">${nomi}</div>
        ${manzil ? `<div style="font-size:13px;color:#5B6B82;margin-top:2px">${manzil}</div>` : ''}
        <div style="font-size:13px;font-weight:700;margin-top:4px;color:${ochiq ? '#15803D' : '#DC2626'}">
          ${ochiq ? L_('Ochiq', 'Открыто') : L_('Yopiq', 'Закрыто')}${ph.ishBoshlanishi && ph.ishTugashi ? ` · ${esc(ph.ishBoshlanishi)}–${esc(ph.ishTugashi)}` : ''}
          ${ph._km != null ? ` · ${ph._km < 1 ? Math.round(ph._km * 1000) + ' m' : ph._km.toFixed(1) + ' km'}` : ''}
        </div>
        ${ph.telefon ? `<a href="${telHavola(ph.telefon)}" style="display:block;font-size:13px;font-weight:700;color:#2563EB;margin-top:4px">${esc(ph.telefon)}</a>` : ''}
        <div style="display:flex;gap:6px;margin-top:10px">
          <button type="button" data-act="ochish" style="flex:1;padding:8px 10px;border-radius:10px;border:0;background:#2563EB;color:#fff;font-weight:700;font-size:13px;cursor:pointer">${L_("Dorilarini ko'rish", 'Лекарства')}</button>
          <a href="${xaritaHavolasi(ph) || '#'}" data-act="yol" target="_blank" rel="noreferrer" style="flex:1;text-align:center;padding:8px 10px;border-radius:10px;border:1px solid #CBD5E1;color:#0F172A;font-weight:700;font-size:13px;text-decoration:none">${L_("Yo'l ko'rsatish", 'Маршрут')}</a>
        </div>`
      box.querySelector('[data-act="ochish"]')?.addEventListener('click', () => onOpenRef.current(ph))
      box.querySelector('[data-act="yol"]')?.addEventListener('click', (e) => {
        const url = xaritaHavolasi(ph)
        if (!url) return
        e.preventDefault()
        tashqiOch(url)
      })
      // Oyna ochilganda xarita shunday suriladiki, u tepadagi qidiruv maydoni va pastdagi tugmalar ostida qolmaydi.
      L.marker(joy, { icon: belgi(ochiq), title: ph.nomi || ph.name || '' })
        .bindPopup(box, { maxWidth: 280, autoPanPaddingTopLeft: L.point(12, 84), autoPanPaddingBottomRight: L.point(64, 16) })
        .addTo(layer)
    })

    if (userLat != null && userLon != null) {
      const men = L.latLng(userLat, userLon)
      L.marker(men, { icon: SIZ, zIndexOffset: 1000, title: L_('Siz shu yerdasiz', 'Вы здесь') })
        .bindPopup(L_('Siz shu yerdasiz', 'Вы здесь'))
        .addTo(layer)
      // Eng yaqin 3 ta dorixona va foydalanuvchi bir ekranga sig'sin.
      const yaqinlar = nuqtalar.slice().sort((a, b) => a.distanceTo(men) - b.distanceTo(men)).slice(0, 3)
      if (yaqinlar.length) map.fitBounds(L.latLngBounds([men, ...yaqinlar]).pad(0.25), { maxZoom: 16 })
      else map.setView(men, 14)
    } else if (nuqtalar.length > 1) {
      map.fitBounds(L.latLngBounds(nuqtalar).pad(0.2), { maxZoom: 15 })
    } else if (nuqtalar.length === 1) {
      map.setView(nuqtalar[0], 15)
    }
  }, [imzo, userLat, userLon, lang])

  return <div ref={boxRef} className={'isolate bg-slate-100 ' + (className ?? 'h-[420px] w-full rounded-2xl overflow-hidden')} />
}
