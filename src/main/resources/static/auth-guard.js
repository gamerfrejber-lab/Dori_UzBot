/*
 * Kirish nazorati (barcha sahifalarda <head> ichida ishlaydi).
 *
 * - Telegram Mini App ichida ochilgan bo'lsa: Telegram bergan initData imzosini serverga
 *   yuborib, telefon va SMS kodsiz avtomatik kiradi (ilova kabi).
 * - Oddiy brauzerda: token bo'lmasa login sahifasiga yo'naltiradi.
 */
(function () {
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var isAuthPage = ['login.html', 'sms.html', 'ism.html'].indexOf(page) !== -1;
    // Ochiq (Google indekslashi kerak bo'lgan) sahifalar. Bularga login talab qilinmaydi —
    // mehmonlar dorixonalarni ko'rishi, dorilarni qidirishi mumkin. Bron qilish uchungina
    // ular login.html'ga yo'naltiriladi (o'sha yerda tekshiruv qilinadi).
    var isPublicPage = ['index.html', 'dorixonalar.html', 'taqdimot.html', ''].indexOf(page) !== -1;
    var token = localStorage.getItem('token');
    var tg = window.Telegram && window.Telegram.WebApp;

    if (tg) {
        try {
            tg.ready();
            tg.expand();
        } catch (e) {
            // Telegram SDK'ning eski versiyalarida expand bo'lmasligi mumkin — muhim emas.
        }
    }

    // Allaqachon kirgan — hech narsa qilmaymiz (ism kiritish sahifasi ham buzilmasin).
    if (token) return;

    var initData = tg && tg.initData;
    if (initData) {
        // Kirish tugaguncha sahifa ko'rinmasin, aks holda login ekrani bir lahza chaqnaydi.
        document.documentElement.style.visibility = 'hidden';
        fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: initData })
        })
            .then(function (response) {
                return response.ok ? response.json() : Promise.reject(new Error('auth failed'));
            })
            .then(function (data) {
                if (!data || !data.token) return Promise.reject(new Error('no token'));
                localStorage.setItem('token', data.token);
                var user = tg.initDataUnsafe && tg.initDataUnsafe.user;
                if (user) {
                    var name = ((user.first_name || '') + ' ' + (user.last_name || '')).trim();
                    if (name) localStorage.setItem('userName', name);
                }
                location.replace('index.html');
            })
            .catch(function () {
                document.documentElement.style.visibility = 'visible';
                if (!isAuthPage && !isPublicPage) location.replace('login.html');
            });
        return;
    }

    if (!isAuthPage && !isPublicPage) location.replace('login.html');
})();

/*
 * Admin bo'lsa, sarlavhadagi menyuda "Admin panel" havolasi paydo bo'ladi.
 * Admin bo'lmaganlar uchun hech narsa qo'shilmaydi.
 */
document.addEventListener('DOMContentLoaded', function () {
    var token = localStorage.getItem('token');
    var page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (!token || page === 'admin.html') return;

    fetch('/api/admin/check', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) { if (!r.ok) throw new Error('not admin'); return r.json(); })
        .then(function (data) {
            if (!data || !data.admin) return;
            var nav = document.querySelector('nav');
            if (!nav || nav.querySelector('[data-admin-link]')) return;
            var link = document.createElement('a');
            link.href = 'admin.html';
            link.innerHTML = 'Admin';
            link.setAttribute('data-admin-link', '1');
            var langSwitch = nav.querySelector('.lang-switch');
            if (langSwitch) nav.insertBefore(link, langSwitch);
            else nav.appendChild(link);
        })
        .catch(function () { /* admin emas yoki tarmoq xatosi — havola ko'rsatilmaydi */ });
});
