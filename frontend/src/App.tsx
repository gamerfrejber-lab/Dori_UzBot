import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from '@/hooks/useLanguage'
import { CartProvider } from '@/hooks/useCart'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CartPanel } from '@/components/CartPanel'
import { Home } from '@/pages/Home'
import { Dorixonalar } from '@/pages/Dorixonalar'
import { Login } from '@/pages/Login'
import { SmsVerify } from '@/pages/SmsVerify'
import { Profil } from '@/pages/Profil'
import { Admin } from '@/pages/Admin'

function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <LangProvider>
        <CartProvider>
          <Aurora />
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/index.html" element={<Home />} />
              <Route path="/dorixonalar" element={<Dorixonalar />} />
              <Route path="/dorixonalar.html" element={<Dorixonalar />} />
              <Route path="/login" element={<Login />} />
              <Route path="/login.html" element={<Login />} />
              <Route path="/sms" element={<SmsVerify />} />
              <Route path="/sms.html" element={<SmsVerify />} />
              <Route path="/profil" element={<Profil />} />
              <Route path="/profil.html" element={<Profil />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin.html" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
          <CartPanel />
        </CartProvider>
      </LangProvider>
    </BrowserRouter>
  )
}
