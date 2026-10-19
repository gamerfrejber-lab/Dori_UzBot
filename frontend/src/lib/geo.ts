export interface UserLocation {
  lat: number
  lon: number
}

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => deg * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number, lang: 'uz' | 'ru'): string {
  return km < 1
    ? `${Math.round(km * 1000)} ${lang === 'uz' ? 'm' : 'м'}`
    : `${km.toFixed(1)} ${lang === 'uz' ? 'km' : 'км'}`
}

/** Joylashuv olinmasa — sababi: ruxsat berilmagan, Telegram'da ruxsat yo'q, aniqlab bo'lmadi. */
export type JoylashuvXato = 'rad' | 'rad_telegram' | 'yoq'
export type JoylashuvNatija = { loc: UserLocation } | { xato: JoylashuvXato }

type TgLocationManager = {
  isInited: boolean
  isLocationAvailable: boolean
  isAccessRequested: boolean
  isAccessGranted: boolean
  init: (cb?: () => void) => void
  getLocation: (cb: (data: { latitude: number; longitude: number } | null) => void) => void
  openSettings: () => void
}

function tgJoylashuv(): TgLocationManager | null {
  const wa = (window as unknown as {
    Telegram?: { WebApp?: { initData?: string; isVersionAtLeast?: (v: string) => boolean; LocationManager?: TgLocationManager } }
  }).Telegram?.WebApp
  if (!wa?.initData || !wa.LocationManager || !wa.isVersionAtLeast?.('8.0')) return null
  return wa.LocationManager
}

/** Telegram Mini App ichida bo'lsa — Telegram sozlamalaridagi joylashuv ruxsatini ochadi. */
export function telegramJoylashuvSozlamasi(): boolean {
  const lm = tgJoylashuv()
  if (!lm) return false
  lm.openSettings()
  return true
}

function brauzerdan(): Promise<JoylashuvNatija> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ xato: 'yoq' })
    const ol = (aniq: boolean, ikkinchi: boolean) =>
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ loc: { lat: pos.coords.latitude, lon: pos.coords.longitude } }),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) return resolve({ xato: 'rad' })
          // GPS topolmasa — tarmoq bo'yicha taxminiy joyni so'raymiz.
          if (!ikkinchi) return ol(!aniq, true)
          resolve({ xato: 'yoq' })
        },
        { enableHighAccuracy: aniq, timeout: aniq ? 12000 : 8000, maximumAge: 120000 }
      )
    ol(true, false)
  })
}

/**
 * Foydalanuvchi joylashuvi. Telegram Mini App ichida Telegram'ning o'z LocationManager'i ishlatiladi
 * (Telegram ichidagi brauzer oddiy geolokatsiyani ko'pincha bermaydi), aks holda brauzer geolokatsiyasi.
 */
export function joylashuvOl(): Promise<JoylashuvNatija> {
  const lm = tgJoylashuv()
  if (!lm) return brauzerdan()
  return new Promise((resolve) => {
    const so_ra = () => {
      if (!lm.isLocationAvailable) return brauzerdan().then(resolve)
      lm.getLocation((d) => {
        if (d) return resolve({ loc: { lat: d.latitude, lon: d.longitude } })
        if (lm.isAccessRequested && !lm.isAccessGranted) return resolve({ xato: 'rad_telegram' })
        brauzerdan().then(resolve)
      })
    }
    if (lm.isInited) so_ra()
    else lm.init(so_ra)
  })
}

/** Ruxsat avval berilgan bo'lsa — so'rov oynasisiz joylashuvni olish mumkinmi. */
export async function joylashuvRuxsatiBormi(): Promise<boolean> {
  const lm = tgJoylashuv()
  if (lm) {
    await new Promise<void>((r) => (lm.isInited ? r() : lm.init(() => r())))
    return lm.isLocationAvailable && lm.isAccessGranted
  }
  try {
    const p = await navigator.permissions?.query({ name: 'geolocation' as PermissionName })
    return p?.state === 'granted'
  } catch {
    return false
  }
}

export async function requestLocation(): Promise<UserLocation | null> {
  const n = await joylashuvOl()
  return 'loc' in n ? n.loc : null
}

export function dorixonaOchiqmi(ishBoshlanishi: string | null, ishTugashi: string | null): boolean {
  if (!ishBoshlanishi || !ishTugashi) return true
  const now = new Date()
  const hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
  return hm >= ishBoshlanishi && hm < ishTugashi
}
