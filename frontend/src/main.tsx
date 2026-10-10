import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Telegram Mini App ichida ochilganda Telegram'ga tayyorligimizni bildiramiz (oddiy brauzerda hech narsa qilmaydi).
const tg = (window as unknown as { Telegram?: { WebApp?: { ready?: () => void; expand?: () => void } } }).Telegram?.WebApp
tg?.ready?.()
tg?.expand?.()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
