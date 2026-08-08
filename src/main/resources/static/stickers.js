/*
 * Maxsus SVG stikerlar to'plami.
 *
 * Nega emoji emas: emoji har bir qurilmada boshqacha chiziladi (iPhone'da bitta, Android'da
 * boshqacha) va sayt "oddiy" ko'rinadi. Bu stikerlar esa vektor — barcha telefonlarda aynan
 * bir xil, brend rangida va hajmli. Sahifaga bir marta yashirin SVG "sprite" joylanadi,
 * so'ng har joyda shunday ishlatiladi:
 *
 *     <svg class="stk"><use href="#stk-pill"></use></svg>
 *
 * yoki JS orqali:  stk('pill')  ->  shu HTML satrini qaytaradi.
 */
(function () {
  var SPRITE = `
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">
  <defs>
    <linearGradient id="stkBrand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#38C6B4"/>
      <stop offset="1" stop-color="#7C6BF5"/>
    </linearGradient>
    <linearGradient id="stkWarm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFB86C"/>
      <stop offset="1" stop-color="#FF6FA5"/>
    </linearGradient>
    <linearGradient id="stkMint" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5AD7C0"/>
      <stop offset="1" stop-color="#2E9BE6"/>
    </linearGradient>
  </defs>

  <!-- Kapsula (dori qidirish) -->
  <symbol id="stk-pill" viewBox="0 0 48 48">
    <rect x="7" y="19" width="34" height="18" rx="9" transform="rotate(-45 24 28)" fill="url(#stkBrand)"/>
    <path d="M24 12.6 36.4 25a8.7 8.7 0 0 1 0 12.3l-.1.1L23.9 25z" transform="rotate(-45 24 28)" fill="#fff" opacity="0.32"/>
    <circle cx="19.5" cy="19.5" r="1.7" fill="#fff" opacity="0.9"/>
    <circle cx="24" cy="24" r="1.7" fill="#fff" opacity="0.9"/>
  </symbol>

  <!-- Lupa (qidiruv) -->
  <symbol id="stk-search" viewBox="0 0 48 48">
    <circle cx="21" cy="21" r="12" fill="none" stroke="url(#stkBrand)" stroke-width="4.5"/>
    <circle cx="21" cy="21" r="6.5" fill="#fff" opacity="0.18"/>
    <rect x="30" y="30.5" width="12" height="5.4" rx="2.7" transform="rotate(45 30 30.5)" fill="url(#stkBrand)"/>
  </symbol>

  <!-- Xarita nuqtasi (lokatsiya, masofa) -->
  <symbol id="stk-pin" viewBox="0 0 48 48">
    <path d="M24 4c-8.3 0-15 6.5-15 14.6 0 9.8 12.6 23.2 14 24.6a1.4 1.4 0 0 0 2 0c1.4-1.4 14-14.8 14-24.6C39 10.5 32.3 4 24 4z" fill="url(#stkBrand)"/>
    <circle cx="24" cy="18.5" r="6.2" fill="#fff"/>
    <circle cx="24" cy="18.5" r="3" fill="url(#stkBrand)" opacity="0.55"/>
  </symbol>

  <!-- Dorixona (xoch) -->
  <symbol id="stk-pharmacy" viewBox="0 0 48 48">
    <rect x="6" y="6" width="36" height="36" rx="11" fill="url(#stkMint)"/>
    <rect x="20.6" y="13" width="6.8" height="22" rx="3.4" fill="#fff"/>
    <rect x="13" y="20.6" width="22" height="6.8" rx="3.4" fill="#fff"/>
  </symbol>

  <!-- Savat (bron qilish) -->
  <symbol id="stk-basket" viewBox="0 0 48 48">
    <path d="M9 18h30l-2.6 20.2A5 5 0 0 1 31.4 42H16.6a5 5 0 0 1-4.9-3.8z" fill="url(#stkBrand)"/>
    <path d="M16 18a8 8 0 0 1 16 0" fill="none" stroke="url(#stkBrand)" stroke-width="4" stroke-linecap="round"/>
    <circle cx="19" cy="27" r="2.1" fill="#fff" opacity="0.85"/>
    <circle cx="29" cy="27" r="2.1" fill="#fff" opacity="0.85"/>
  </symbol>

  <!-- Profil (foydalanuvchi) -->
  <symbol id="stk-user" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="20" fill="url(#stkBrand)" opacity="0.16"/>
    <circle cx="24" cy="19" r="7.5" fill="url(#stkBrand)"/>
    <path d="M10.5 39a13.5 13.5 0 0 1 27 0z" fill="url(#stkBrand)"/>
  </symbol>

  <!-- Telefon -->
  <symbol id="stk-phone" viewBox="0 0 48 48">
    <rect x="14" y="5" width="20" height="38" rx="6" fill="url(#stkMint)"/>
    <rect x="17.5" y="10" width="13" height="24" rx="2.5" fill="#fff" opacity="0.9"/>
    <circle cx="24" cy="38" r="2.1" fill="#fff"/>
  </symbol>

  <!-- Quti (ombor, qoldiq) -->
  <symbol id="stk-box" viewBox="0 0 48 48">
    <path d="M24 5 41 14v20L24 43 7 34V14z" fill="url(#stkBrand)"/>
    <path d="M24 5 41 14 24 23 7 14z" fill="#fff" opacity="0.28"/>
    <path d="M24 23v20L7 34V14z" fill="#000" opacity="0.10"/>
  </symbol>

  <!-- Tasdiq belgisi -->
  <symbol id="stk-check" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="19" fill="url(#stkMint)"/>
    <path d="M15 24.5 21.5 31 33.5 18" fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <!-- Soat (kutilmoqda) -->
  <symbol id="stk-clock" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="19" fill="url(#stkWarm)"/>
    <path d="M24 13v11l7 5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <!-- Uy (bosh sahifa / yaqin) -->
  <symbol id="stk-home" viewBox="0 0 48 48">
    <path d="M24 6 6 21v20a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V21z" fill="url(#stkBrand)"/>
    <rect x="19" y="28" width="10" height="15" rx="2" fill="#fff" opacity="0.85"/>
  </symbol>

  <!-- Yurak-puls (salomatlik / hero) -->
  <symbol id="stk-pulse" viewBox="0 0 48 48">
    <path d="M24 42S6 30 6 17.5A9.5 9.5 0 0 1 24 12a9.5 9.5 0 0 1 18 5.5C42 30 24 42 24 42z" fill="url(#stkWarm)"/>
    <path d="M12 26h6l3-7 4 12 3-7h8" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <!-- Qalqon (ishonch / xavfsizlik) -->
  <symbol id="stk-shield" viewBox="0 0 48 48">
    <path d="M24 4 8 10v13c0 11 7.4 18.6 16 21 8.6-2.4 16-10 16-21V10z" fill="url(#stkBrand)"/>
    <path d="M16 24.5 22 30.5 33 18" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <!-- Retsept varaqasi -->
  <symbol id="stk-doc" viewBox="0 0 48 48">
    <path d="M12 5h16l8 8v28a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" fill="url(#stkMint)"/>
    <path d="M28 5v8h8z" fill="#fff" opacity="0.4"/>
    <rect x="16" y="22" width="16" height="3.2" rx="1.6" fill="#fff"/>
    <rect x="16" y="29" width="11" height="3.2" rx="1.6" fill="#fff"/>
  </symbol>
</svg>`;

  // Stikerlar har sahifada bir xil o'lchamda bo'lishi uchun asosiy CSS ham shu yerdan
  // joylanadi — sahifalarga alohida yozish shart emas. img va svg bir xil o'lchamda.
  var CSS = '.stk{width:1.35em;height:1.35em;display:inline-block;vertical-align:-0.28em;flex:none;'
          + 'object-fit:contain;overflow:visible}'
          + 'img.stk{filter:drop-shadow(0 2px 6px rgba(0,0,0,0.35))}'
          + '.stk-lg{width:2.3rem;height:2.3rem;vertical-align:middle}'
          + '.stk-xl{width:3.2rem;height:3.2rem;vertical-align:middle}';

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

  // Zaxira: sprite'dan SVG element yasaydi (rasm yuklanmaganda ishlatiladi).
  window.stkSvg = function (nom, klass) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'stk ' + (klass || ''));
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#stk-' + nom);
    svg.appendChild(use);
    return svg;
  };

  // <img> yuklanmasa — o'zini SVG zaxira bilan almashtiradi (o'lcham/uslubni saqlab).
  window.stkFallback = function (img) {
    img.onerror = null;
    var svg = window.stkSvg(img.getAttribute('data-stk'), img.className.replace('stk', '').trim());
    if (img.getAttribute('style')) svg.setAttribute('style', img.getAttribute('style'));
    img.replaceWith(svg);
  };

  // Matn ichida ishlatish uchun: stk('pill') -> '<img ... onerror=zaxira>'
  window.stk = function (nom, klass) {
    return '<img class="stk ' + (klass || '') + '" data-stk="' + nom + '" alt="" '
         + 'src="icons/' + nom + '.png" onerror="stkFallback(this)">';
  };
})();
