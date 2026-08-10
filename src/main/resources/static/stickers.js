/*
 * 3D SVG ikonkalar to'plami — barcha qurilmada bir xil ko'rinish.
 *
 * Ko'k-neon shisha (glassmorphism) uslubida — sayt dizayni bilan bir xil.
 * PNG rasmlar asosiy, SVG esa zaxira (fallback). PNG topilmasa SVG ko'rinadi.
 *
 * Ishlatish:
 *   HTML: <svg class="stk"><use href="#stk-pill"></use></svg>
 *   JS:   stk('pill')  ->  inline <img> (PNG mavjud bo'lsa) yoki SVG
 */
(function () {
  var SPRITE = `
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
  <defs>
    <!-- Neon ko'k — asosiy gradient -->
    <linearGradient id="g3neon" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#7DD3FC"/>
      <stop offset="0.45" stop-color="#38BDF8"/>
      <stop offset="1" stop-color="#0369A1"/>
    </linearGradient>
    <!-- Chuqur ko'k — quyuqroq elementlar -->
    <linearGradient id="g3deep" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#60A5FA"/>
      <stop offset="0.5" stop-color="#3B82F6"/>
      <stop offset="1" stop-color="#1E40AF"/>
    </linearGradient>
    <!-- Binafsha — vurgu, maxsus elementlar -->
    <linearGradient id="g3violet" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#C4B5FD"/>
      <stop offset="0.5" stop-color="#8B5CF6"/>
      <stop offset="1" stop-color="#5B21B6"/>
    </linearGradient>
    <!-- Tozal ko'k — shisha effekt -->
    <linearGradient id="g3glass" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="#A5F3FC"/>
      <stop offset="0.5" stop-color="#22D3EE"/>
      <stop offset="1" stop-color="#0891B2"/>
    </linearGradient>
    <!-- Yashil neon — mavjud/muvaffaqiyat -->
    <linearGradient id="g3green" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#6EE7B7"/>
      <stop offset="0.5" stop-color="#10B981"/>
      <stop offset="1" stop-color="#047857"/>
    </linearGradient>
    <!-- Qizil neon — xato/mavjud emas -->
    <linearGradient id="g3red" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#FCA5A5"/>
      <stop offset="0.5" stop-color="#EF4444"/>
      <stop offset="1" stop-color="#991B1B"/>
    </linearGradient>
    <!-- Oltin — maxsus -->
    <linearGradient id="g3gold" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="#FDE68A"/>
      <stop offset="0.5" stop-color="#F59E0B"/>
      <stop offset="1" stop-color="#B45309"/>
    </linearGradient>
    <!-- Neon glow filtr -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <!-- Radial shisha yaltiroq -->
    <radialGradient id="rShine" cx="0.35" cy="0.25" r="0.65">
      <stop offset="0" stop-color="#fff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- ============ DORI / KAPSULA (pill) ============ -->
  <symbol id="stk-pill" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="12" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="7" y="14" width="34" height="20" rx="10" fill="url(#g3neon)"/>
    <rect x="24" y="14" width="17" height="20" rx="10" fill="url(#g3violet)"/>
    <ellipse cx="15" cy="19" rx="7" ry="4.5" fill="#fff" opacity="0.35" transform="rotate(-12 15 19)"/>
    <ellipse cx="33" cy="19" rx="5" ry="3.5" fill="#fff" opacity="0.2" transform="rotate(-10 33 19)"/>
    <line x1="24" y1="15" x2="24" y2="33" stroke="#fff" stroke-width="1.2" opacity="0.25"/>
    <ellipse cx="24" cy="24" rx="16" ry="9" fill="url(#rShine)" opacity="0.3"/>
  </symbol>

  <!-- ============ QIDIRUV / LUPA (search) ============ -->
  <symbol id="stk-search" viewBox="0 0 48 48">
    <ellipse cx="22" cy="44" rx="12" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <circle cx="20" cy="20" r="14" fill="url(#g3neon)"/>
    <circle cx="20" cy="20" r="9" fill="#0c4a6e" opacity="0.6"/>
    <circle cx="20" cy="20" r="7" fill="#082f49" opacity="0.4"/>
    <ellipse cx="16" cy="14" rx="6" ry="4" fill="#fff" opacity="0.35" transform="rotate(-20 16 14)"/>
    <rect x="30" y="30" width="13" height="6" rx="3" transform="rotate(45 30 30)" fill="url(#g3deep)"/>
    <rect x="31" y="31.5" width="8" height="2.5" rx="1.2" transform="rotate(45 31 31.5)" fill="#fff" opacity="0.3"/>
  </symbol>

  <!-- ============ XARITA NUQTASI / PIN (pin) ============ -->
  <symbol id="stk-pin" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="8" ry="2.5" fill="#0ea5e9" opacity="0.25"/>
    <path d="M24 4C15.7 4 9 10.5 9 18.6c0 9.8 12.6 23.2 14 24.6a1.4 1.4 0 002 0c1.4-1.4 14-14.8 14-24.6C39 10.5 32.3 4 24 4z" fill="url(#g3deep)"/>
    <ellipse cx="19" cy="12" rx="7" ry="4.5" fill="#fff" opacity="0.3" transform="rotate(-15 19 12)"/>
    <circle cx="24" cy="18.5" r="7" fill="#fff" opacity="0.15"/>
    <circle cx="24" cy="18.5" r="4" fill="#fff" opacity="0.8"/>
    <circle cx="24" cy="18.5" r="2" fill="url(#g3deep)" opacity="0.5"/>
  </symbol>

  <!-- ============ DORIXONA / XOCH (pharmacy) ============ -->
  <symbol id="stk-pharmacy" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="12" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="6" y="6" width="36" height="34" rx="10" fill="url(#g3glass)"/>
    <ellipse cx="17" cy="13" rx="8" ry="5" fill="#fff" opacity="0.3" transform="rotate(-10 17 13)"/>
    <rect x="20.5" y="12" width="7" height="22" rx="3.5" fill="#fff" opacity="0.9"/>
    <rect x="13" y="19.5" width="22" height="7" rx="3.5" fill="#fff" opacity="0.9"/>
    <path d="M36 34c2-1 5-3 6-6" fill="none" stroke="#22d3ee" stroke-width="2" opacity="0.4" stroke-linecap="round"/>
  </symbol>

  <!-- ============ SAVAT / BRON (basket) ============ -->
  <symbol id="stk-basket" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="12" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <path d="M9 18h30l-2.5 19a5 5 0 01-5 4H16.5a5 5 0 01-5-4z" fill="url(#g3neon)"/>
    <path d="M9 18h30l-1 7H10z" fill="#fff" opacity="0.25"/>
    <path d="M16 18a8 8 0 0116 0" fill="none" stroke="url(#g3deep)" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="17" cy="13" rx="4" ry="2.5" fill="#fff" opacity="0.3"/>
    <rect x="16" y="27" width="16" height="3" rx="1.5" fill="#fff" opacity="0.3"/>
    <rect x="18" y="32" width="12" height="3" rx="1.5" fill="#fff" opacity="0.2"/>
  </symbol>

  <!-- ============ PROFIL / ODAM (user) ============ -->
  <symbol id="stk-user" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="12" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <circle cx="24" cy="22" r="18" fill="url(#g3deep)" opacity="0.15"/>
    <circle cx="24" cy="22" r="16" fill="url(#g3neon)" opacity="0.12"/>
    <circle cx="24" cy="16" r="8" fill="url(#g3neon)"/>
    <ellipse cx="20" cy="13" rx="4" ry="3" fill="#fff" opacity="0.35" transform="rotate(-12 20 13)"/>
    <path d="M10 39a14 14 0 0128 0" fill="url(#g3neon)"/>
    <path d="M14 39a10 10 0 0120 0" fill="#fff" opacity="0.15"/>
  </symbol>

  <!-- ============ TELEFON (phone) ============ -->
  <symbol id="stk-phone" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="10" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="13" y="3" width="22" height="40" rx="5" fill="url(#g3deep)"/>
    <ellipse cx="20" cy="9" rx="5" ry="3.5" fill="#fff" opacity="0.3" transform="rotate(-5 20 9)"/>
    <rect x="16" y="9" width="16" height="26" rx="2" fill="#0c4a6e" opacity="0.6"/>
    <circle cx="24" cy="39" r="2.2" fill="#fff" opacity="0.5"/>
    <path d="M22 22a3.5 3.5 0 01-2-3.2c0-1.8 1.3-2.8 2.8-2.8h1.4c.5 0 1 .5.8 1l-.5 1.5a.5.5 0 01-.5.3h-.5a1.5 1.5 0 000 3h.5a.5.5 0 01.5.3l.5 1.5c.2.5-.3 1-.8 1h-1.4" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
  </symbol>

  <!-- ============ QUTI / OMBOR (box) ============ -->
  <symbol id="stk-box" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="12" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <path d="M24 4L42 13v20L24 42 6 33V13z" fill="url(#g3deep)"/>
    <path d="M24 4L42 13 24 22 6 13z" fill="#fff" opacity="0.35"/>
    <path d="M24 22v20L6 33V13z" fill="#000" opacity="0.15"/>
    <path d="M24 22v20l18-9V13z" fill="#000" opacity="0.05"/>
    <ellipse cx="16" cy="10" rx="5" ry="3" fill="#fff" opacity="0.25" transform="rotate(-25 16 10)"/>
    <line x1="24" y1="22" x2="24" y2="42" stroke="#fff" stroke-width="0.8" opacity="0.2"/>
  </symbol>

  <!-- ============ TASDIQ / CHECK (check) ============ -->
  <symbol id="stk-check" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <circle cx="24" cy="22" r="18" fill="url(#g3neon)"/>
    <ellipse cx="17" cy="12" rx="8" ry="5" fill="#fff" opacity="0.3" transform="rotate(-15 17 12)"/>
    <path d="M15 22l6.5 7L33 16" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <!-- ============ SOAT / KUTILMOQDA (clock) ============ -->
  <symbol id="stk-clock" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <circle cx="24" cy="22" r="18" fill="url(#g3deep)"/>
    <circle cx="24" cy="22" r="14" fill="#0c4a6e" opacity="0.3"/>
    <ellipse cx="17" cy="12" rx="7" ry="5" fill="#fff" opacity="0.3" transform="rotate(-15 17 12)"/>
    <path d="M24 11v11l7 5" fill="none" stroke="#7dd3fc" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="24" cy="22" r="2" fill="#7dd3fc" opacity="0.8"/>
    <circle cx="24" cy="22" r="18" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.3"/>
  </symbol>

  <!-- ============ UY / BOSH SAHIFA (home) ============ -->
  <symbol id="stk-home" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="12" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <path d="M24 4L5 20v19a4 4 0 004 4h30a4 4 0 004-4V20z" fill="url(#g3neon)"/>
    <path d="M24 4L5 20h38z" fill="#fff" opacity="0.3"/>
    <ellipse cx="15" cy="15" rx="6" ry="4" fill="#fff" opacity="0.25" transform="rotate(-30 15 15)"/>
    <rect x="18" y="26" width="12" height="17" rx="2" fill="#0c4a6e" opacity="0.5"/>
    <rect x="20" y="28" width="8" height="8" rx="1" fill="#7dd3fc" opacity="0.4"/>
  </symbol>

  <!-- ============ YURAK-PULS (pulse) ============ -->
  <symbol id="stk-pulse" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <path d="M24 40S6 28 6 16a9.5 9.5 0 0118-4 9.5 9.5 0 0118 4c0 12-18 24-18 24z" fill="url(#g3glass)"/>
    <ellipse cx="16" cy="13" rx="6" ry="4" fill="#fff" opacity="0.4" transform="rotate(-20 16 13)"/>
    <path d="M11 24h6l3-8 4 14 3-8h10" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <!-- ============ QALQON (shield) ============ -->
  <symbol id="stk-shield" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <path d="M24 3L7 10v13c0 11 8 19 17 21 9-2 17-10 17-21V10z" fill="url(#g3deep)"/>
    <path d="M24 3L7 10v6c5 0 11-2 17-5 6 3 12 5 17 5V10z" fill="#fff" opacity="0.25"/>
    <ellipse cx="16" cy="12" rx="6" ry="4" fill="#fff" opacity="0.3" transform="rotate(-20 16 12)"/>
    <path d="M16 23l6 6 10-12" fill="none" stroke="#7dd3fc" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <!-- ============ HUJJAT / RETSEPT (doc) ============ -->
  <symbol id="stk-doc" viewBox="0 0 48 48">
    <ellipse cx="22" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <path d="M12 4h16l9 9v28a3 3 0 01-3 3H12a3 3 0 01-3-3V7a3 3 0 013-3z" fill="url(#g3neon)"/>
    <path d="M28 4v9h9z" fill="#fff" opacity="0.4"/>
    <ellipse cx="16" cy="10" rx="6" ry="4" fill="#fff" opacity="0.3" transform="rotate(-10 16 10)"/>
    <rect x="15" y="22" width="16" height="3" rx="1.5" fill="#fff" opacity="0.6"/>
    <rect x="15" y="28" width="12" height="3" rx="1.5" fill="#fff" opacity="0.45"/>
    <rect x="15" y="34" width="14" height="3" rx="1.5" fill="#fff" opacity="0.3"/>
  </symbol>

  <!-- ============ LINEYKA / MASOFA (ruler) ============ -->
  <symbol id="stk-ruler" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="5" y="14" width="38" height="18" rx="3" fill="url(#g3deep)"/>
    <ellipse cx="15" cy="18" rx="7" ry="4" fill="#fff" opacity="0.3" transform="rotate(-5 15 18)"/>
    <line x1="12" y1="14" x2="12" y2="23" stroke="#7dd3fc" stroke-width="1.8" opacity="0.7"/>
    <line x1="18" y1="14" x2="18" y2="20" stroke="#7dd3fc" stroke-width="1.5" opacity="0.5"/>
    <line x1="24" y1="14" x2="24" y2="23" stroke="#7dd3fc" stroke-width="1.8" opacity="0.7"/>
    <line x1="30" y1="14" x2="30" y2="20" stroke="#7dd3fc" stroke-width="1.5" opacity="0.5"/>
    <line x1="36" y1="14" x2="36" y2="23" stroke="#7dd3fc" stroke-width="1.8" opacity="0.7"/>
  </symbol>

  <!-- ============ YASHIL DOIRA / MAVJUD (available) ============ -->
  <symbol id="stk-available" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="9" ry="2.2" fill="#10b981" opacity="0.25"/>
    <circle cx="24" cy="22" r="16" fill="url(#g3green)"/>
    <ellipse cx="18" cy="13" rx="7" ry="5" fill="#fff" opacity="0.35" transform="rotate(-15 18 13)"/>
    <circle cx="16" cy="11" r="3" fill="#fff" opacity="0.2"/>
  </symbol>

  <!-- ============ QIZIL DOIRA / MAVJUD EMAS (unavailable) ============ -->
  <symbol id="stk-unavailable" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="9" ry="2.2" fill="#ef4444" opacity="0.25"/>
    <circle cx="24" cy="22" r="16" fill="url(#g3red)"/>
    <ellipse cx="18" cy="13" rx="7" ry="5" fill="#fff" opacity="0.3" transform="rotate(-15 18 13)"/>
    <circle cx="16" cy="11" r="3" fill="#fff" opacity="0.18"/>
  </symbol>

  <!-- ============ BEKOR / XATO BELGISI (cancel) ============ -->
  <symbol id="stk-cancel" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#ef4444" opacity="0.2"/>
    <circle cx="24" cy="22" r="18" fill="url(#g3red)"/>
    <ellipse cx="17" cy="12" rx="7" ry="5" fill="#fff" opacity="0.3" transform="rotate(-15 17 12)"/>
    <path d="M17 15l14 14M31 15L17 29" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>
  </symbol>

  <!-- ============ ZAVOD / ISHLAB CHIQARUVCHI (factory) ============ -->
  <symbol id="stk-factory" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="12" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="6" y="20" width="36" height="21" rx="2" fill="url(#g3deep)"/>
    <path d="M6 20l10-12v12l10-10v10l12-8v8" fill="url(#g3neon)"/>
    <path d="M6 20l10-12v12l10-10v10" fill="#fff" opacity="0.25"/>
    <rect x="10" y="28" width="6" height="6" rx="1" fill="#7dd3fc" opacity="0.5"/>
    <rect x="20" y="28" width="6" height="6" rx="1" fill="#7dd3fc" opacity="0.4"/>
    <rect x="30" y="26" width="6" height="15" rx="1" fill="#7dd3fc" opacity="0.35"/>
    <rect x="37" y="6" width="4" height="14" rx="1" fill="url(#g3deep)"/>
    <ellipse cx="39" cy="6" rx="3" ry="2" fill="#60a5fa" opacity="0.4"/>
  </symbol>

  <!-- ============ PUL / NARX (money) ============ -->
  <symbol id="stk-money" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="4" y="10" width="40" height="26" rx="4" fill="url(#g3neon)"/>
    <ellipse cx="15" cy="16" rx="7" ry="4.5" fill="#fff" opacity="0.3" transform="rotate(-10 15 16)"/>
    <circle cx="24" cy="23" r="8" fill="#fff" opacity="0.15"/>
    <circle cx="24" cy="23" r="6" fill="#fff" opacity="0.1"/>
    <text x="24" y="27.5" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" opacity="0.85" font-family="sans-serif">$</text>
    <circle cx="8" cy="14" r="2.5" fill="#fff" opacity="0.12"/>
    <circle cx="40" cy="32" r="2.5" fill="#fff" opacity="0.12"/>
  </symbol>

  <!-- ============ YORLIQ / NOM (label) ============ -->
  <symbol id="stk-label" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="6" y="10" width="36" height="26" rx="5" fill="url(#g3deep)"/>
    <ellipse cx="15" cy="16" rx="7" ry="4" fill="#fff" opacity="0.25" transform="rotate(-10 15 16)"/>
    <text x="24" y="29" text-anchor="middle" font-size="16" font-weight="800" fill="#7dd3fc" opacity="0.9" font-family="sans-serif" letter-spacing="2">Aa</text>
  </symbol>

  <!-- ============ IGNA / PUSHPIN (pushpin) ============ -->
  <symbol id="stk-pushpin" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="8" ry="2.2" fill="#0ea5e9" opacity="0.2"/>
    <circle cx="24" cy="14" r="10" fill="url(#g3neon)"/>
    <ellipse cx="20" cy="10" rx="5" ry="3" fill="#fff" opacity="0.35" transform="rotate(-15 20 10)"/>
    <rect x="22.5" y="23" width="3" height="18" rx="1.5" fill="url(#g3deep)"/>
    <ellipse cx="24" cy="42" rx="2" ry="1" fill="#60a5fa" opacity="0.4"/>
  </symbol>

  <!-- ============ BUFER / CLIPBOARD (clipboard) ============ -->
  <symbol id="stk-clipboard" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="10" y="8" width="28" height="34" rx="4" fill="url(#g3deep)"/>
    <ellipse cx="17" cy="14" rx="6" ry="4" fill="#fff" opacity="0.25" transform="rotate(-8 17 14)"/>
    <rect x="19" y="4" width="10" height="8" rx="3" fill="url(#g3neon)"/>
    <rect x="21" y="5" width="6" height="4" rx="2" fill="#fff" opacity="0.5"/>
    <rect x="16" y="20" width="16" height="2.5" rx="1.2" fill="#7dd3fc" opacity="0.5"/>
    <rect x="16" y="26" width="12" height="2.5" rx="1.2" fill="#7dd3fc" opacity="0.4"/>
    <rect x="16" y="32" width="14" height="2.5" rx="1.2" fill="#7dd3fc" opacity="0.3"/>
  </symbol>

  <!-- ============ ESHIK / CHIQISH (door) ============ -->
  <symbol id="stk-door" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="12" y="4" width="24" height="38" rx="3" fill="url(#g3deep)"/>
    <ellipse cx="19" cy="11" rx="5" ry="3.5" fill="#fff" opacity="0.25" transform="rotate(-10 19 11)"/>
    <rect x="15" y="7" width="18" height="32" rx="2" fill="#0c4a6e" opacity="0.4"/>
    <circle cx="30" cy="24" r="2.2" fill="#7dd3fc" opacity="0.7"/>
    <path d="M35 18l6 6-6 6" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="28" y1="24" x2="40" y2="24" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
  </symbol>

  <!-- ============ YULDUZ (star) ============ -->
  <symbol id="stk-star" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#f59e0b" opacity="0.2"/>
    <path d="M24 4l5.8 12.5L43 18.4l-9.5 9 2.5 13.6L24 34.5 12 41l2.5-13.6-9.5-9 13.2-1.9z" fill="url(#g3gold)"/>
    <path d="M24 4l5.8 12.5L43 18.4l-9.5 9-1 .8L24 20z" fill="#fff" opacity="0.3"/>
    <ellipse cx="17" cy="13" rx="4" ry="3" fill="#fff" opacity="0.25" transform="rotate(-20 17 13)"/>
  </symbol>

  <!-- ============ XAFA / TOPILMADI (sad) ============ -->
  <symbol id="stk-sad" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <circle cx="24" cy="22" r="18" fill="url(#g3deep)"/>
    <ellipse cx="17" cy="12" rx="7" ry="5" fill="#fff" opacity="0.3" transform="rotate(-15 17 12)"/>
    <circle cx="17" cy="20" r="2.5" fill="#7dd3fc"/>
    <circle cx="31" cy="20" r="2.5" fill="#7dd3fc"/>
    <ellipse cx="16.5" cy="19" rx="1" ry="0.6" fill="#fff" opacity="0.7"/>
    <ellipse cx="30.5" cy="19" rx="1" ry="0.6" fill="#fff" opacity="0.7"/>
    <path d="M17 32c2-3.5 5-5 7-5s5 1.5 7 5" fill="none" stroke="#7dd3fc" stroke-width="2.5" stroke-linecap="round"/>
  </symbol>

  <!-- ============ BAYROQ RU (ru) ============ -->
  <symbol id="stk-ru" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.15"/>
    <rect x="6" y="8" width="36" height="30" rx="4" fill="#CE2028"/>
    <rect x="6" y="8" width="36" height="10" rx="4" fill="#fff"/>
    <rect x="6" y="8" width="36" height="10" fill="#fff"/>
    <rect x="6" y="18" width="36" height="10" fill="url(#g3deep)"/>
    <rect x="6" y="28" width="36" height="10" rx="4" fill="#CE2028"/>
    <rect x="6" y="28" width="36" height="6" fill="#CE2028"/>
    <ellipse cx="15" cy="13" rx="6" ry="4" fill="#fff" opacity="0.15" transform="rotate(-10 15 13)"/>
    <rect x="6" y="8" width="36" height="30" rx="4" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.3"/>
  </symbol>

  <!-- ============ QULF / XAVFSIZLIK (lock) ============ -->
  <symbol id="stk-lock" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="10" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="10" y="20" width="28" height="22" rx="5" fill="url(#g3deep)"/>
    <ellipse cx="17" cy="25" rx="6" ry="4" fill="#fff" opacity="0.25" transform="rotate(-10 17 25)"/>
    <path d="M16 20v-6a8 8 0 0116 0v6" fill="none" stroke="#38bdf8" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="24" cy="31" r="3.5" fill="#7dd3fc" opacity="0.7"/>
    <rect x="22.5" y="31" width="3" height="5" rx="1.5" fill="#7dd3fc" opacity="0.5"/>
  </symbol>

  <!-- ============ KUTISH / QUMSOAT (waiting) ============ -->
  <symbol id="stk-waiting" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="10" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <circle cx="24" cy="22" r="18" fill="url(#g3violet)"/>
    <ellipse cx="17" cy="12" rx="7" ry="5" fill="#fff" opacity="0.3" transform="rotate(-15 17 12)"/>
    <circle cx="24" cy="22" r="13" fill="#fff" opacity="0.08"/>
    <path d="M24 10v12l7 5" fill="none" stroke="#c4b5fd" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="24" cy="22" r="2" fill="#c4b5fd" opacity="0.8"/>
  </symbol>

  <!-- ============ KALIT (key) ============ -->
  <symbol id="stk-key" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="10" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <circle cx="17" cy="18" r="10" fill="url(#g3neon)"/>
    <circle cx="17" cy="18" r="5" fill="#0c4a6e" opacity="0.4"/>
    <ellipse cx="13" cy="13" rx="4" ry="3" fill="#fff" opacity="0.35" transform="rotate(-15 13 13)"/>
    <rect x="24" y="16" width="18" height="5" rx="2.5" fill="url(#g3neon)"/>
    <rect x="36" y="21" width="4" height="6" rx="1" fill="url(#g3deep)"/>
    <rect x="30" y="21" width="4" height="5" rx="1" fill="url(#g3deep)"/>
  </symbol>

  <!-- ============ XABAR / KONVERT (mail) ============ -->
  <symbol id="stk-mail" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="5" y="12" width="38" height="24" rx="4" fill="url(#g3neon)"/>
    <path d="M5 14l19 13 19-13" fill="none" stroke="#fff" stroke-width="2.5" opacity="0.5"/>
    <ellipse cx="17" cy="17" rx="8" ry="4" fill="#fff" opacity="0.25" transform="rotate(-15 17 17)"/>
  </symbol>

  <!-- ============ KIRISH / YUKLAB OLISH (inbox) ============ -->
  <symbol id="stk-inbox" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="9" y="9" width="30" height="30" rx="5" fill="url(#g3neon)"/>
    <path d="M24 14v16M17 23l7 7 7-7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="18" cy="13" rx="6" ry="3.5" fill="#fff" opacity="0.3" transform="rotate(-10 18 13)"/>
  </symbol>

  <!-- ============ CHIQISH / YUKLASH (outbox) ============ -->
  <symbol id="stk-outbox" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="9" y="9" width="30" height="30" rx="5" fill="url(#g3deep)"/>
    <path d="M24 34V18M17 25l7-7 7 7" fill="none" stroke="#7dd3fc" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="18" cy="13" rx="6" ry="3.5" fill="#fff" opacity="0.25" transform="rotate(-10 18 13)"/>
  </symbol>

  <!-- ============ DIAGRAM / STATISTIKA (chart) ============ -->
  <symbol id="stk-chart" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="7" y="7" width="34" height="34" rx="5" fill="url(#g3violet)"/>
    <ellipse cx="17" cy="12" rx="7" ry="4" fill="#fff" opacity="0.25" transform="rotate(-10 17 12)"/>
    <rect x="13" y="26" width="6" height="11" rx="1.5" fill="#c4b5fd" opacity="0.8"/>
    <rect x="21" y="18" width="6" height="19" rx="1.5" fill="#c4b5fd" opacity="0.9"/>
    <rect x="29" y="22" width="6" height="15" rx="1.5" fill="#c4b5fd" opacity="0.7"/>
  </symbol>

  <!-- ============ KAMERA / SURAT (camera) ============ -->
  <symbol id="stk-camera" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <path d="M17 14l2-4h10l2 4h8a3 3 0 013 3v18a3 3 0 01-3 3H9a3 3 0 01-3-3V17a3 3 0 013-3h8z" fill="url(#g3deep)"/>
    <circle cx="24" cy="25" r="8" fill="#0c4a6e" opacity="0.5"/>
    <circle cx="24" cy="25" r="5.5" fill="#38bdf8" opacity="0.5"/>
    <circle cx="24" cy="25" r="3" fill="#7dd3fc" opacity="0.3"/>
    <ellipse cx="19" cy="17" rx="6" ry="3" fill="#fff" opacity="0.3" transform="rotate(-10 19 17)"/>
  </symbol>

  <!-- ============ ID KARTA (id) ============ -->
  <symbol id="stk-id" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <rect x="5" y="11" width="38" height="26" rx="4" fill="url(#g3neon)"/>
    <rect x="10" y="16" width="10" height="13" rx="2" fill="#fff" opacity="0.35"/>
    <rect x="24" y="19" width="14" height="3" rx="1.5" fill="#fff" opacity="0.5"/>
    <rect x="24" y="25" width="10" height="3" rx="1.5" fill="#fff" opacity="0.35"/>
    <ellipse cx="15" cy="15" rx="6" ry="3.5" fill="#fff" opacity="0.2" transform="rotate(-10 15 15)"/>
  </symbol>

  <!-- ============ TAQIQLANGAN / RUXSAT YO'Q (denied) ============ -->
  <symbol id="stk-denied" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#ef4444" opacity="0.2"/>
    <circle cx="24" cy="22" r="16" fill="url(#g3red)"/>
    <rect x="12" y="20" width="24" height="5" rx="2.5" fill="#fff" opacity="0.8" transform="rotate(-45 24 22)"/>
    <ellipse cx="18" cy="12" rx="6" ry="4" fill="#fff" opacity="0.25" transform="rotate(-15 18 12)"/>
  </symbol>

  <!-- ============ GURUH / FOYDALANUVCHILAR (group) ============ -->
  <symbol id="stk-group" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <circle cx="18" cy="15" r="7" fill="url(#g3neon)"/>
    <ellipse cx="18" cy="30" rx="10" ry="7" fill="url(#g3neon)"/>
    <ellipse cx="15" cy="11" rx="3.5" ry="2.5" fill="#fff" opacity="0.35"/>
    <circle cx="33" cy="17" r="6" fill="url(#g3deep)"/>
    <ellipse cx="33" cy="30" rx="8" ry="6" fill="url(#g3deep)"/>
    <ellipse cx="31" cy="14" rx="2.5" ry="2" fill="#fff" opacity="0.25"/>
  </symbol>

  <!-- ============ OGOHLANTIRISH (warning) ============ -->
  <symbol id="stk-warning" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#f59e0b" opacity="0.2"/>
    <path d="M24 4L4 40h40L24 4z" fill="url(#g3gold)"/>
    <rect x="22" y="16" width="4" height="14" rx="2" fill="#78350f" opacity="0.7"/>
    <circle cx="24" cy="35" r="2.5" fill="#78350f" opacity="0.7"/>
    <ellipse cx="18" cy="12" rx="5" ry="3" fill="#fff" opacity="0.3" transform="rotate(-30 18 12)"/>
  </symbol>

  <!-- ============ QO'SHISH / PLYUS (plus) ============ -->
  <symbol id="stk-plus" viewBox="0 0 48 48">
    <ellipse cx="24" cy="44" rx="11" ry="2.5" fill="#0ea5e9" opacity="0.2"/>
    <circle cx="24" cy="22" r="16" fill="url(#g3neon)"/>
    <ellipse cx="18" cy="12" rx="6" ry="4" fill="#fff" opacity="0.3" transform="rotate(-15 18 12)"/>
    <rect x="21" y="12" width="6" height="20" rx="3" fill="#fff" opacity="0.85"/>
    <rect x="14" y="19" width="20" height="6" rx="3" fill="#fff" opacity="0.85"/>
  </symbol>
</svg>`;

  var CSS = '@keyframes stk-glow{0%,100%{filter:drop-shadow(0 0 6px rgba(56,189,248,0.45)) drop-shadow(0 2px 3px rgba(0,0,0,0.25))}50%{filter:drop-shadow(0 0 14px rgba(56,189,248,0.6)) drop-shadow(0 0 28px rgba(59,130,246,0.25)) drop-shadow(0 2px 3px rgba(0,0,0,0.25))}}'
          + '.stk{width:2.5em;height:2.5em;display:inline-block;vertical-align:-0.5em;flex:none;'
          + 'object-fit:contain;overflow:visible}'
          + 'img.stk{filter:drop-shadow(0 0 8px rgba(56,189,248,0.4)) drop-shadow(0 2px 3px rgba(0,0,0,0.2));'
          + 'animation:stk-glow 3s ease-in-out infinite}'
          + '.stk-sm{width:1.6em;height:1.6em;vertical-align:-0.3em}'
          + '.stk-lg{width:4rem;height:4rem;vertical-align:middle}'
          + '.stk-xl{width:5.5rem;height:5.5rem;vertical-align:middle}'
          + '.stk-xxl{width:7rem;height:7rem;vertical-align:middle}'
          + '.stk-hero{width:clamp(4.5rem,12vw,7.5rem);height:clamp(4.5rem,12vw,7.5rem);vertical-align:middle}'
          + '.stk-title{width:3.2rem;height:3.2rem;vertical-align:-0.55rem}'
          + '.stk-card{width:3.5rem;height:3.5rem;vertical-align:middle;margin-right:0.6rem}'
          + '.stk-nav{width:2.2rem;height:2.2rem;vertical-align:-0.35em}'
          + '.stk-search{width:1.3rem;height:1.3rem;vertical-align:-0.15em}';

  function inject() {
    if (document.getElementById('stk-sprite')) return;
    var css = document.createElement('style');
    css.textContent = CSS;
    document.head.appendChild(css);
    var holder = document.createElement('div');
    holder.id = 'stk-sprite';
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.innerHTML = SPRITE;
    document.body.insertBefore(holder, document.body.firstChild);
  }

  if (document.body) inject();
  else document.addEventListener('DOMContentLoaded', inject);

  /*
   * Stikerlar ikki manbadan keladi:
   *  1) icons/<nom>.png  — foydalanuvchi qo'ygan chiroyli 3D rasmlar (asosiy);
   *  2) ichki SVG sprite — rasm topilmasa avtomatik ishga tushadigan zaxira.
   * Shunday qilib PNG'lar hali qo'yilmagan bo'lsa ham sayt buzilmaydi, PNG qo'yilgach
   * o'zi chiroyli rasmga o'tadi.
   */

  window.stkSvg = function (nom, klass) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'stk ' + (klass || ''));
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#stk-' + nom);
    svg.appendChild(use);
    return svg;
  };

  window.stkFallback = function (img) {
    img.onerror = null;
    var svg = window.stkSvg(img.getAttribute('data-stk'), img.className.replace('stk', '').trim());
    if (img.getAttribute('style')) svg.setAttribute('style', img.getAttribute('style'));
    img.replaceWith(svg);
  };

  window.stk = function (nom, klass) {
    return '<img class="stk ' + (klass || '') + '" data-stk="' + nom + '" alt="" '
         + 'src="icons/' + nom + '.png" onerror="stkFallback(this)">';
  };

  function initStickyHeader() {
    var hdr = document.querySelector('header');
    if (!hdr) return;
    var last = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY || window.pageYOffset;
      if (y > 10 && last <= 10) hdr.classList.add('scrolled');
      else if (y <= 10 && last > 10) hdr.classList.remove('scrolled');
      last = y;
    }, { passive: true });
  }
  if (document.body) initStickyHeader();
  else document.addEventListener('DOMContentLoaded', initStickyHeader);
})();
