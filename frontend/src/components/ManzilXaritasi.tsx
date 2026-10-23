import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const TOSHKENT: L.LatLngExpression = [41.3111, 69.2797]

const UY = L.divIcon({
  className: '',
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  html: `<svg width="30" height="38" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 41C17 41 32 26.5 32 16.5C32 8 25.3 1.5 17 1.5S2 8 2 16.5C2 26.5 17 41 17 41Z" fill="#DC2626" stroke="#fff" stroke-width="2.5"/>
    <circle cx="17" cy="16" r="5.5" fill="#fff"/></svg>`,
})

const DORIXONA = L.divIcon({
  className: '',
  iconSize: [26, 32],
  iconAnchor: [13, 30],
  html: `<svg width="26" height="32" viewBox="0 0 34 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 41C17 41 32 26.5 32 16.5C32 8 25.3 1.5 17 1.5S2 8 2 16.5C2 26.5 17 41 17 41Z" fill="#2563EB" stroke="#fff" stroke-width="2.5"/>
    <path d="M17 11v11M11.5 16.5h11" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
})

/**
 * Yetkazish manzilini xaritada belgilash: xaritani bosish yoki qizil belgini surish bilan.
 * Ko'k belgi — dorixona (masofa undan hisoblanadi).
 */
export default function ManzilXaritasi({ lat, lon, dorixona, onChange }: {
  lat: number | null
  lon: number | null
  dorixona: { latitude: number | null; longitude: number | null } | null
  onChange: (lat: number, lon: number) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const uyRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!boxRef.current || mapRef.current) return
    const dx = dorixona?.latitude && dorixona?.longitude ? L.latLng(dorixona.latitude, dorixona.longitude) : null
    const map = L.map(boxRef.current, { zoomControl: true, attributionControl: true }).setView(dx ?? TOSHKENT, dx ? 14 : 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(map)
    map.attributionControl.setPrefix(false)
    if (dx) L.marker(dx, { icon: DORIXONA, interactive: false }).addTo(map)
    const qoy = (p: L.LatLng) => {
      const la = Math.round(p.lat * 1e6) / 1e6, lo = Math.round(p.lng * 1e6) / 1e6
      if (!uyRef.current) {
        uyRef.current = L.marker([la, lo], { icon: UY, draggable: true }).addTo(map)
        uyRef.current.on('dragend', () => qoy(uyRef.current!.getLatLng()))
      } else {
        uyRef.current.setLatLng([la, lo])
      }
      onChangeRef.current(la, lo)
    }
    map.on('click', (e: L.LeafletMouseEvent) => qoy(e.latlng))
    mapRef.current = map
    const ro = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    ro.observe(boxRef.current)
    return () => { ro.disconnect(); map.remove(); mapRef.current = null; uyRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Joylashuv tashqaridan (masalan "Joylashuvim" tugmasi) kelganda belgini o'sha yerga qo'yamiz.
  useEffect(() => {
    const map = mapRef.current
    if (!map || lat == null || lon == null) return
    if (!uyRef.current) {
      uyRef.current = L.marker([lat, lon], { icon: UY, draggable: true }).addTo(map)
      uyRef.current.on('dragend', () => {
        const p = uyRef.current!.getLatLng()
        onChangeRef.current(Math.round(p.lat * 1e6) / 1e6, Math.round(p.lng * 1e6) / 1e6)
      })
    } else {
      const p = uyRef.current.getLatLng()
      if (Math.abs(p.lat - lat) < 1e-6 && Math.abs(p.lng - lon) < 1e-6) return
      uyRef.current.setLatLng([lat, lon])
    }
    map.setView([lat, lon], Math.max(map.getZoom(), 15))
  }, [lat, lon])

  return <div ref={boxRef} className="isolate h-[220px] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100" />
}
