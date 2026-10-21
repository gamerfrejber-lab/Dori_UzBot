// Telegram Mini App ichida ishlash uchun yordamchilar (oddiy brauzerda hech narsa qilmaydi).

type WebApp = {
  initData?: string
  isVersionAtLeast?: (v: string) => boolean
  openLink?: (url: string, opts?: { try_instant_view?: boolean }) => void
  disableVerticalSwipes?: () => void
  enableVerticalSwipes?: () => void
}

function webApp(): WebApp | null {
  const wa = (window as unknown as { Telegram?: { WebApp?: WebApp } }).Telegram?.WebApp
  return wa?.initData ? wa : null
}

/**
 * Tashqi havolani ochadi. Telegram ichida — Telegram'ning o'z usuli bilan (telefonda Yandex Xarita ilovasi
 * o'rnatilgan bo'lsa o'sha ochiladi), oddiy brauzerda — yangi oynada.
 */
export function tashqiOch(url: string) {
  const wa = webApp()
  if (wa?.openLink) {
    wa.openLink(url, { try_instant_view: false })
    return
  }
  window.open(url, '_blank', 'noopener')
}

/**
 * Telegram'da pastga surish ilovani yopadi/kichraytiradi — xaritani surishda bu xalaqit beradi.
 * Xarita sahifasida o'chiriladi; qaytarilgan funksiya sahifadan chiqqanda yoqib qo'yadi.
 */
export function vertikalSurishniOchir(): () => void {
  const wa = webApp()
  if (!wa?.disableVerticalSwipes || !wa.isVersionAtLeast?.('7.7')) return () => {}
  wa.disableVerticalSwipes()
  return () => wa.enableVerticalSwipes?.()
}
