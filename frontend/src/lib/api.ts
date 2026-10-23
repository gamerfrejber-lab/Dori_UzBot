export interface Dorixona {
  id: number
  nomi: string
  name?: string
  manzil: string
  address?: string
  telefon: string
  latitude: number | null
  longitude: number | null
  ishBoshlanishi: string | null
  ishTugashi: string | null
  yetkazishYoqilgan?: boolean | null
}

export interface DoriKatalog {
  id: number
  nomi: string
  nomiUz?: string
  nomiRu?: string
  ishlabChiqaruvchi: string | null
  davlat: string | null
}

export interface DoriQidiruvResult {
  id: number
  nomi?: string
  name?: string
  nomi_ru?: string
  nameRu?: string
  ishlab_chiqaruvchi?: string
  manufacturer?: string
  narx?: number
  price?: number
  pachkaNarx?: number
  pachkadagiDona?: number | null
  available?: boolean
  dorixona?: Dorixona
  qoldiq?: number
  hisobYuritiladi?: boolean
  _km?: number | null
}

const BASE = ''

async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(BASE + url, { signal })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function katalogSoni(): Promise<{ jami: number }> {
  return get('/api/katalog/soni')
}

export async function dorixonalar(): Promise<Dorixona[]> {
  return get('/api/dorixona')
}

export async function katalogQidirish(q: string, limit = 12): Promise<DoriKatalog[]> {
  return get(`/api/katalog/qidirish?q=${encodeURIComponent(q)}&limit=${limit}`)
}

/** signal — eski (endi keraksiz) so'rovni bekor qilish uchun: foydalanuvchi yozishda davom etsa. */
export async function autocomplete(q: string, limit = 30, signal?: AbortSignal): Promise<DoriKatalog[]> {
  return get(`/api/katalog/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`, signal)
}

export async function doriKategoriya(slug: string): Promise<DoriQidiruvResult[]> {
  return get(`/api/dori/kategoriya/${encodeURIComponent(slug)}`)
}

export async function doriQidirish(nomi: string): Promise<DoriQidiruvResult[]> {
  const r = await fetch(`/api/dori/qidirish?nomi=${encodeURIComponent(nomi)}`)
  if (r.status === 404) return []
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export async function bronQilish(
  doriId: number,
  soni: number,
  tur: 'dona' | 'pachka',
  token: string
): Promise<{ kod: string; doriTugadi?: boolean }> {
  const r = await fetch('/api/bron', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ doriId, soni, tur }),
  })
  if (!r.ok) {
    const data = await r.json().catch(() => ({}))
    throw new Error(data.xato || 'Bron qilib bo\'lmadi')
  }
  return r.json()
}

export interface YoriqnomaTil {
  guruh: string
  qollanilishi: string[]
  qabul_qilish: string[]
  doza: string[]
  mumkin_emas: string[]
  birga_ichilmaydi: string[]
  nojoya: string[]
  homiladorlik: string
  ehtiyot: string[]
}

export interface DoriYoriqnomasi {
  dori_emas: boolean
  ishonch: 'yuqori' | 'orta' | 'past'
  tasir_moddasi: string
  retseptli: boolean
  uz: YoriqnomaTil
  ru: YoriqnomaTil
}

export interface DoriMalumotJavob {
  holat: 'TAYYOR' | 'KUTMOQDA' | 'NAVBATDA' | 'DORI_EMAS' | 'XATO' | 'YOQ'
  ishlabChiqaruvchi?: string | null
  davlat?: string | null
  malumot?: DoriYoriqnomasi
}

/** Dori yo'riqnomasi (qo'llanilishi, dozasi, qarshi ko'rsatmalar...) — nomi bo'yicha. */
export async function doriMalumot(nomi: string): Promise<DoriMalumotJavob> {
  return get(`/api/dori/malumot?nomi=${encodeURIComponent(nomi)}`)
}

export async function dorixonaDorilar(id: number): Promise<DoriQidiruvResult[]> {
  return get(`/api/dorixona/${id}/dorilar`)
}

/** Juda ko'p urinish (429): server matnida qancha kutish kerakligi yozilgan. */
export class JudaKopUrinish extends Error {}

/** Kod yetkazilmadi: raqam botda ro'yxatdan o'tmagan (botga /start bosilmagan yoki raqam ulashilmagan). */
export class KodYetkazilmadi extends Error {}

export async function sendCode(phoneNumber: string): Promise<{ message?: string }> {
  const r = await fetch('/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  })
  const data = await r.json().catch(() => ({}))
  // Server kodni yubora olmasa 400 qaytaradi — bunda "kod yuborildi" sahifasiga o'tmaymiz.
  if (r.status === 400) throw new KodYetkazilmadi(data.message || '')
  // Juda tez-tez so'ralsa (masalan, daqiqasiga bir martadan ko'p) server 429 qaytaradi va qancha kutishni aytadi.
  if (r.status === 429) throw new JudaKopUrinish(data.message || '')
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return data
}

export async function verifyCode(phoneNumber: string, code: string): Promise<{ token?: string; message?: string }> {
  const r = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code }),
  })
  return r.json()
}

/** Telegram Mini App ichida: Telegram imzolagan initData orqali kodsiz kirish. */
export async function telegramLogin(initData: string): Promise<{ token?: string | null; manba?: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const r = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
      signal: controller.signal,
    })
    return await r.json()
  } finally {
    clearTimeout(timer)
  }
}

export interface UserProfile {
  name: string | null
  phoneNumber: string
  createdAt: string | null
  role?: string
}

export async function getProfile(token: string): Promise<UserProfile> {
  const r = await fetch('/api/auth/profile', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export interface BronItem {
  id: number
  kod: string
  doriNomi: string
  dorixonaNomi: string
  soni: number
  tur: string
  sana: string
  holat: string
}

export async function getBronlar(token: string): Promise<BronItem[]> {
  const r = await fetch('/api/bron/meniki', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) return []
  return r.json()
}

export async function adminCheck(token: string): Promise<{ admin: boolean }> {
  const r = await fetch('/api/admin/check', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) return { admin: false }
  return r.json()
}

export async function adminStats(token: string): Promise<Record<string, number>> {
  const r = await fetch('/api/admin/stats', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) return {}
  return r.json()
}
