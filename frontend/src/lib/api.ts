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

async function get<T>(url: string): Promise<T> {
  const r = await fetch(BASE + url)
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

export async function autocomplete(q: string, limit = 30): Promise<DoriKatalog[]> {
  return get(`/api/katalog/autocomplete?q=${encodeURIComponent(q)}&limit=${limit}`)
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

export async function dorixonaDorilar(id: number): Promise<DoriQidiruvResult[]> {
  return get(`/api/dorixona/${id}/dorilar`)
}

export async function sendCode(phoneNumber: string): Promise<{ message?: string }> {
  const r = await fetch('/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  })
  return r.json()
}

export async function verifyCode(phoneNumber: string, code: string): Promise<{ token?: string; message?: string }> {
  const r = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code }),
  })
  return r.json()
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
  const r = await fetch('/api/bron/list', {
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
