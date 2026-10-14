// Admin va dorixonachi panellari uchun umumiy yordamchilar.

/** Token bilan so'rov yuboradi; xato bo'lsa serverning "xato" matnini chiqaradi. */
export async function authJson<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = { ...((opts.headers as Record<string, string>) || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  if (opts.body && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const r = await fetch(url, { ...opts, headers })
  const text = await r.text()
  let data: any = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }
  if (!r.ok) {
    const err = new Error(data?.xato || `HTTP ${r.status}`) as Error & { data?: any }
    err.data = data
    throw err
  }
  return data as T
}

export const som = (n: number | null | undefined) => Math.round(n || 0).toLocaleString('ru-RU')

export interface PanelDori {
  id: number
  name: string
  nameRu?: string | null
  manufacturer?: string | null
  price: number | null
  pachkaNarx?: number | null
  pachkadagiDona?: number | null
  available?: boolean | null
  qoldiq?: number | null
  hisobYuritiladi?: boolean | null
}

export interface Hisobot {
  mahsulotlar: { doriId: number; nomi: string; narx: number; kelgan: number; sotilgan: number; qoldiq: number; tushum: number }[]
  turlarSoni: number
  jamiKelgan: number
  jamiSotilgan: number
  jamiQoldiq: number
  jamiTushum: number
  omborQiymati: number
}

/** Mahsulotlar blokining serverga murojaatlari — admin va dorixonachi uchun turli manzillar. */
export interface DoriApi {
  list: () => Promise<PanelDori[]>
  add: (d: Partial<PanelDori>) => Promise<unknown>
  update: (id: number, d: Partial<PanelDori>) => Promise<unknown>
  remove: (id: number) => Promise<unknown>
  stock: (turi: 'kirim' | 'chiqim', doriId: number, soni: number) => Promise<{ qoldiq?: number }>
  importFile: (file: File) => Promise<{ soni?: number }>
  hisobot: () => Promise<Hisobot>
}

export function adminDoriApi(dorixonaId: number): DoriApi {
  return {
    list: () => authJson(`/api/admin/dorixona/${dorixonaId}/dorilar`),
    add: (d) => authJson(`/api/admin/dorixona/${dorixonaId}/dori`, { method: 'POST', body: JSON.stringify(d) }),
    update: (id, d) => authJson(`/api/admin/dori/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    remove: (id) => authJson(`/api/admin/dori/${id}`, { method: 'DELETE' }),
    stock: (turi, doriId, soni) =>
      authJson(`/api/admin/ombor/${turi}`, { method: 'POST', body: JSON.stringify({ doriId, soni }) }),
    importFile: (file) => {
      const fd = new FormData()
      fd.append('file', file)
      return authJson(`/api/admin/dori/qoshish-import/${dorixonaId}`, { method: 'POST', body: fd })
    },
    hisobot: () => authJson(`/api/admin/ombor/hisobot/${dorixonaId}`),
  }
}

export const ownerDoriApi: DoriApi = {
  list: () => authJson('/api/dorixonachi/dorilar'),
  add: (d) => authJson('/api/dorixonachi/dori', { method: 'POST', body: JSON.stringify(d) }),
  update: (id, d) => authJson(`/api/dorixonachi/dori/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  remove: (id) => authJson(`/api/dorixonachi/dori/${id}`, { method: 'DELETE' }),
  stock: (turi, doriId, soni) =>
    authJson(`/api/dorixonachi/ombor/${turi}`, { method: 'POST', body: JSON.stringify({ doriId, soni }) }),
  importFile: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return authJson('/api/dorixonachi/dori/import', { method: 'POST', body: fd })
  },
  hisobot: () => authJson('/api/dorixonachi/ombor/hisobot'),
}

/** Bron holatining nomi va rangi (botdagi bilan bir xil holatlar). */
export const BRON_HOLAT: Record<string, { uz: string; ru: string; cls: string }> = {
  YANGI: { uz: 'Yangi', ru: 'Новая', cls: 'bg-blue-50 text-blue-700' },
  TAYYOR: { uz: 'Tayyor', ru: 'Готова', cls: 'bg-green-50 text-green-700' },
  BERILDI: { uz: 'Berildi', ru: 'Выдана', cls: 'bg-slate-100 text-slate-600' },
  BEKOR: { uz: 'Bekor qilindi', ru: 'Отменена', cls: 'bg-red-50 text-red-600' },
}
