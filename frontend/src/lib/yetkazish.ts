// Yetkazib berish (dorini dorixonaning o'zi yetkazadi; sayt mijozdan haq olmaydi).

export type YetkazishHolat = 'YANGI' | 'QABUL' | 'YOLDA' | 'YETKAZILDI' | 'BEKOR'
export type TolovUsuli = 'NAQD' | 'KARTA'

export interface YetkazishQator {
  dori_id: number | null
  nomi: string
  soni: number
  tur: 'dona' | 'pachka'
  narx: number
}

export interface Yetkazish {
  id: number
  dorixona_id: number
  dorixona_nomi: string
  dorixona_telefon: string | null
  dorixona_manzil: string | null
  mijoz_ismi: string | null
  mijoz_telefon: string | null
  manzil: string
  izoh: string | null
  latitude: number | null
  longitude: number | null
  masofa_km: number | null
  dori_summa: number
  yetkazish_narxi: number
  jami: number
  tolov_usuli: TolovUsuli
  tolov_holati: 'KUTILMOQDA' | 'CHEK_YUBORILDI' | 'TASDIQLANDI' | null
  chek_bor: boolean
  holat: YetkazishHolat
  bekor_sababi: string | null
  kuryer_telefon: string | null
  taxminiy_daqiqa: number | null
  kod: string
  sana: string
  qatorlar: YetkazishQator[]
  kartaRaqami?: string | null
}

export interface NarxJavob {
  mumkin: boolean
  sabab?: string
  narx?: number
  jami?: number
  masofaKm?: number
  minSumma?: number
  bepulChegara?: number
  radiusKm?: number
  tolovUsullari?: TolovUsuli[]
}

export interface YetkazishSozlama {
  yoqilgan: boolean
  narx: number
  km_narxi: number
  bepul_chegara: number
  min_summa: number
  radius_km: number
  naqd: boolean
  karta_raqami: string | null
  latitude: number | null
  longitude: number | null
}

export const HOLAT_NOMI: Record<YetkazishHolat, { uz: string; ru: string; rang: string }> = {
  YANGI: { uz: 'Yangi — dorixona javobini kutmoqda', ru: 'Новый — ждёт ответа аптеки', rang: 'bg-amber-100 text-amber-800' },
  QABUL: { uz: 'Qabul qilindi — tayyorlanmoqda', ru: 'Принят — собирается', rang: 'bg-blue-100 text-blue-700' },
  YOLDA: { uz: "Kuryer yo'lda", ru: 'Курьер в пути', rang: 'bg-indigo-100 text-indigo-700' },
  YETKAZILDI: { uz: 'Yetkazildi', ru: 'Доставлен', rang: 'bg-green-100 text-green-700' },
  BEKOR: { uz: 'Bekor qilindi', ru: 'Отменён', rang: 'bg-red-100 text-red-700' },
}

async function sorov<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = { ...((opts.headers as Record<string, string>) || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  if (opts.body && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const r = await fetch(url, { ...opts, headers })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data?.xato || `HTTP ${r.status}`)
  return data as T
}

export function yetkazishNarx(dorixonaId: number, lat: number | null, lon: number | null, summa: number, signal?: AbortSignal) {
  const p = new URLSearchParams({ dorixonaId: String(dorixonaId), summa: String(Math.round(summa)) })
  if (lat != null && lon != null) { p.set('lat', String(lat)); p.set('lon', String(lon)) }
  return sorov<NarxJavob>('/api/yetkazish/narx?' + p, { signal })
}

export function yetkazishBuyurtma(body: {
  dorixonaId: number
  qatorlar: { doriId: number; soni: number; tur: 'dona' | 'pachka' }[]
  manzil: string
  izoh: string
  latitude: number
  longitude: number
  tolovUsuli: TolovUsuli
}) {
  return sorov<Yetkazish>('/api/yetkazish', { method: 'POST', body: JSON.stringify(body) })
}

export const yetkazishMeniki = () => sorov<Yetkazish[]>('/api/yetkazish/meniki')
export const yetkazishBekor = (id: number) => sorov<Yetkazish>(`/api/yetkazish/${id}/bekor`, { method: 'POST' })

export function yetkazishChek(id: number, fayl: File) {
  const fd = new FormData()
  fd.append('chek', fayl)
  return sorov<Yetkazish>(`/api/yetkazish/${id}/chek`, { method: 'POST', body: fd })
}

// Dorixona egasi
export const dxYetkazishlar = () => sorov<Yetkazish[]>('/api/dorixonachi/yetkazish')
export const dxYetkazishHolat = (id: number, body: { holat: YetkazishHolat; daqiqa?: number; kuryerTelefon?: string; sabab?: string }) =>
  sorov<Yetkazish & { ogohlantirish?: string }>(`/api/dorixonachi/yetkazish/${id}/holat`, { method: 'POST', body: JSON.stringify(body) })
export const dxTolovTasdiqla = (id: number) => sorov<Yetkazish>(`/api/dorixonachi/yetkazish/${id}/tolov`, { method: 'POST' })
export const dxSozlama = () => sorov<YetkazishSozlama>('/api/dorixonachi/yetkazish-sozlama')
export const dxSozlamaYoz = (body: Partial<YetkazishSozlama>) =>
  sorov<YetkazishSozlama>('/api/dorixonachi/yetkazish-sozlama', { method: 'PUT', body: JSON.stringify(body) })

/** Chek rasmini tokenli so'rov bilan olib, ko'rsatish uchun vaqtinchalik havola yasaydi. */
export async function chekHavolasi(url: string): Promise<string | null> {
  const token = localStorage.getItem('token')
  const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!r.ok) return null
  return URL.createObjectURL(await r.blob())
}

export const som = (n: number | null | undefined) => Math.round(n || 0).toLocaleString('ru-RU').replace(/,/g, ' ')
