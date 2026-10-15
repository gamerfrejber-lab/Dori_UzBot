// Dorixona joylashuvi va telefoni bilan ishlash uchun yordamchilar.

interface Joy {
  nomi?: string | null
  name?: string | null
  manzil?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
}

/**
 * Xarita havolasi: koordinata bo'lsa — aniq nuqta, bo'lmasa — nomi va manzili bo'yicha
 * qidiruv (shunda koordinata kiritilmagan dorixonani ham xaritadan topsa bo'ladi).
 */
export function xaritaHavolasi(ph: Joy): string | null {
  if (ph.latitude && ph.longitude) {
    return `https://yandex.uz/maps/?pt=${ph.longitude},${ph.latitude}&z=17&l=map`
  }
  const manzil = ph.manzil || ph.address
  if (!manzil) return null
  const soz = [ph.nomi || ph.name, manzil, 'Toshkent'].filter(Boolean).join(', ')
  return `https://yandex.uz/maps/?text=${encodeURIComponent(soz)}`
}

/** "tel:" havolasi — bosilganda telefon qo'ng'iroq qiladi. */
export function telHavola(tel: string): string {
  const d = tel.replace(/[^\d+]/g, '')
  if (d.startsWith('+')) return `tel:${d}`
  if (d.length === 9) return `tel:+998${d}`
  return `tel:+${d}`
}

/**
 * Matndan koordinatani ajratadi: "41.3612, 69.2846", Google xarita havolasi
 * (".../@41.36,69.28,17z" yoki "?q=41.36,69.28") yoki Yandex havolasi ("ll=69.28,41.36",
 * "pt=69.28,41.36" — Yandex'da avval uzunlik keladi).
 */
export function koordinataAjrat(matn: string): { lat: number; lng: number } | null {
  const s = decodeURIComponent(matn.trim())
  const raqam = '(-?\\d{1,3}\\.\\d+)'
  const yandex = s.match(new RegExp(`(?:ll|pt|whatshere%5Bpoint%5D|whatshere\\[point\\])=${raqam}[,\\s]+${raqam}`))
  if (yandex && /yandex|ya\.ru/.test(s)) return tekshir(Number(yandex[2]), Number(yandex[1]))
  const google = s.match(new RegExp(`@${raqam},${raqam}`)) || s.match(new RegExp(`[?&](?:q|ll|query)=${raqam},\\s*${raqam}`))
  if (google) return tekshir(Number(google[1]), Number(google[2]))
  const oddiy = s.match(new RegExp(`^${raqam}[,\\s]+${raqam}$`))
  if (oddiy) return tekshir(Number(oddiy[1]), Number(oddiy[2]))
  return null
}

function tekshir(lat: number, lng: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 }
}
