/*
 * Barmoq bilan surib sahifalar orasida o'tish (iPhone/Android ilovalari kabi).
 *
 * Sahifalar tartibi: Bosh sahifa → Dorixonalar → Profil.
 * Chapga surish — keyingi sahifa, o'ngga surish — oldingisi.
 * Vertikal aylantirish (scroll) buzilmaydi: faqat aniq gorizontal harakatda ishlaydi.
 */
(function () {
  var PAGES = ['index.html', 'dorixonalar.html', 'profil.html'];

  function joriy() {
    var p = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    return PAGES.indexOf(p);
  }

  // Uslub: kirish animatsiyasi va surish davomidagi kichik siljish.
  var st = document.createElement('style');
  st.textContent =
    '@keyframes swp-next{from{opacity:0;transform:translateX(34px)}to{opacity:1;transform:none}}' +
    '@keyframes swp-prev{from{opacity:0;transform:translateX(-34px)}to{opacity:1;transform:none}}' +
    '.swp-pane{will-change:transform,opacity}' +
    '.swp-hint{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:300;' +
      'display:flex;align-items:center;gap:.5rem;padding:.6rem 1.1rem;border-radius:999px;' +
      'font:600 .82rem -apple-system,Segoe UI,sans-serif;color:#EAF3F0;' +
      'background:rgba(255,255,255,.08);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);' +
      'border:1px solid rgba(255,255,255,.16);box-shadow:0 10px 30px rgba(0,0,0,.4);' +
      'opacity:0;transition:opacity .5s ease;pointer-events:none}' +
    '.swp-hint.show{opacity:1}';
  document.head.appendChild(st);

  function panes() {
    var list = document.querySelectorAll('.hero, .container, .profile-container, .login-container');
    return list.length ? list : [document.body];
  }

  // Navigatsiyadan keyin: yangi sahifa qaysi tomondan kelayotganini sessiondan o'qib,
  // yengil sirg'alib chiqadi.
  function kirishAnim() {
    var dir = sessionStorage.getItem('swp-anim');
    if (!dir) return;
    sessionStorage.removeItem('swp-anim');
    panes().forEach(function (el) {
      el.classList.add('swp-pane');
      el.style.animation = 'swp-' + dir + ' .36s cubic-bezier(.22,1,.36,1) both';
    });
  }

  // Bir marta ko'rsatiladigan maslahat: "suring".
  function maslahat() {
    if (localStorage.getItem('swp-korsatildi')) return;
    if (joriy() < 0) return;
    var h = document.createElement('div');
    h.className = 'swp-hint';
    h.innerHTML = '← sahifalarni suring →';
    document.body.appendChild(h);
    requestAnimationFrame(function () { h.classList.add('show'); });
    setTimeout(function () { h.classList.remove('show'); }, 3200);
    setTimeout(function () { h.remove(); }, 3900);
    localStorage.setItem('swp-korsatildi', '1');
  }

  var sx = 0, sy = 0, t0 = 0, faol = false;

  // Interaktiv yoki gorizontal siljiydigan joyda surishni o'chiramiz.
  function bloklangan(el) {
    return el.closest(
      'input,textarea,select,button,a,label,' +
      '.modal,.modal-overlay,.lang-switch,.search-box,[data-no-swipe]'
    );
  }

  document.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || bloklangan(e.target)) { faol = false; return; }
    var t = e.touches[0];
    sx = t.clientX; sy = t.clientY; t0 = Date.now(); faol = true;
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (!faol) return;
    faol = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy, dt = Date.now() - t0;
    // Aniq, tez va gorizontal harakat bo'lishi shart.
    if (dt > 700 || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2) return;

    var i = joriy();
    if (i < 0) return;
    var to = dx < 0 ? i + 1 : i - 1;
    if (to < 0 || to >= PAGES.length) return;

    sessionStorage.setItem('swp-anim', dx < 0 ? 'next' : 'prev');
    panes().forEach(function (el) {
      el.classList.add('swp-pane');
      el.style.transition = 'transform .17s ease, opacity .17s ease';
      el.style.transform = 'translateX(' + (dx < 0 ? -26 : 26) + 'px)';
      el.style.opacity = '0';
    });
    setTimeout(function () { location.href = PAGES[to]; }, 165);
  }, { passive: true });

  function boshla() { kirishAnim(); maslahat(); }
  if (document.readyState !== 'loading') boshla();
  else document.addEventListener('DOMContentLoaded', boshla);
})();
