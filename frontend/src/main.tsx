import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { telegramLogin } from '@/lib/api'

// Telegram Mini App ichida ochilganda Telegram'ga tayyorligimizni bildiramiz (oddiy brauzerda hech narsa qilmaydi).
const tg = (window as unknown as {
  Telegram?: { WebApp?: { ready?: () => void; expand?: () => void; initData?: string } }
}).Telegram?.WebApp
tg?.ready?.()
tg?.expand?.()

// Bot ichidan ochilganda foydalanuvchini Telegram o'zi tasdiqlagan — telefon va kod so'ramay kiritamiz.
// Oddiy brauzerda initData bo'sh bo'ladi va kirish sahifasi (kod bilan) ishlaydi.
async function telegramOrqaliKirish() {
  if (!tg?.initData) return
  try {
    const { token, manba } = await telegramLogin(tg.initData)
    if (token) localStorage.setItem('token', token)
    // Dorixonalar botidan ochilgan bo'lsa — to'g'ri dorixona paneliga.
    if (token && manba === 'dorixona' && (location.pathname === '/' || location.pathname === '/index.html')) {
      history.replaceState(null, '', '/dorixonachi')
    }
  } catch {
    // Bot javob bermasa odatdagi kirish sahifasi ochiladi.
  }
}

telegramOrqaliKirish().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
