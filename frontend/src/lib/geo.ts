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

export function requestLocation(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  })
}

export function dorixonaOchiqmi(ishBoshlanishi: string | null, ishTugashi: string | null): boolean {
  if (!ishBoshlanishi || !ishTugashi) return true
  const now = new Date()
  const hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
  return hm >= ishBoshlanishi && hm < ishTugashi
}
