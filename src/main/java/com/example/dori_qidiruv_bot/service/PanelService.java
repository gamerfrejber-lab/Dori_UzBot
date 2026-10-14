package com.example.dori_qidiruv_bot.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin va dorixonachi panellarining bazaga yozadigan amallari.
 *
 * Sayt, mijozlar boti (dori_UzBot) va dorixonalar boti bitta bazada ishlaydi, shuning uchun
 * bu yerdagi SQL botlardagi bilan aynan bir xil qoidalarga amal qiladi: obuna
 * shartnoma_tugash ustunida, bron holatlari faqat ruxsat etilgan tartibda o'zgaradi,
 * o'chirishda bog'liq yozuvlar ham o'chadi. Shunda saytda qilingan o'zgarish botda ham
 * xuddi o'sha ko'rinishda chiqadi.
 */
@Service
@RequiredArgsConstructor
public class PanelService {

    public static final String YANGI = "YANGI";
    public static final String TAYYOR = "TAYYOR";
    public static final String BERILDI = "BERILDI";
    public static final String BEKOR = "BEKOR";

    private final JdbcTemplate jdbc;
    private final OmborService omborService;

    // ——— Dorixonalar ———

    /** Admin uchun dorixonalar: egasi, obuna holati va mahsulotlar soni bilan. */
    public List<Map<String, Object>> dorixonalar() {
        return jdbc.queryForList("""
                SELECT p.id, p.nomi, p.viloyat, p.tuman, p.manzil, p.telefon,
                       p.ish_boshlanishi, p.ish_tugashi,
                       p.shartnoma_boshlanish::text AS shartnoma_boshlanish,
                       p.shartnoma_tugash::text AS shartnoma_tugash, p.holat,
                       p.egasi_telegram_id, u.full_name AS egasi_ismi, u.phone AS egasi_telefon,
                       (SELECT COUNT(*) FROM dori d WHERE d.dorixona_id = p.id) AS dorilar_soni,
                       (SELECT COUNT(*) FROM bron b WHERE b.dorixona_id = p.id AND b.holat IN ('YANGI', 'TAYYOR')) AS faol_bronlar
                FROM dorixona p
                LEFT JOIN bot_user u ON u.telegram_id = p.egasi_telegram_id
                ORDER BY p.id
                """);
    }

    /** Yangi dorixona (botdagi "➕ Dorixona qo'shish" bilan bir xil maydonlar). */
    public long dorixonaQosh(String nomi, String viloyat, String tuman, String manzil, String telefon,
                             String ishBoshlanishi, String ishTugashi, int oylar) {
        LocalDate bugun = LocalDate.now();
        LocalDate tugash = oylar > 0 ? bugun.plusMonths(oylar) : null;
        Long id = jdbc.queryForObject("""
                INSERT INTO dorixona (nomi, viloyat, tuman, manzil, telefon, ish_boshlanishi, ish_tugashi,
                                      shartnoma_boshlanish, shartnoma_tugash, holat)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'faol') RETURNING id
                """, Long.class, nomi, viloyat, tuman, manzil, telefon, ishBoshlanishi, ishTugashi,
                oylar > 0 ? Date.valueOf(bugun) : null, tugash == null ? null : Date.valueOf(tugash));
        return id == null ? 0 : id;
    }

    /** Dorixona ma'lumotlarini yangilaydi (null kelgan maydon o'zgarmaydi). */
    public boolean dorixonaYangila(long id, Map<String, String> m) {
        return jdbc.update("""
                UPDATE dorixona SET
                    nomi = COALESCE(?, nomi), viloyat = COALESCE(?, viloyat), tuman = COALESCE(?, tuman),
                    manzil = COALESCE(?, manzil), telefon = COALESCE(?, telefon),
                    ish_boshlanishi = COALESCE(?, ish_boshlanishi), ish_tugashi = COALESCE(?, ish_tugashi)
                WHERE id = ?
                """, bosh(m.get("nomi")), bosh(m.get("viloyat")), bosh(m.get("tuman")), bosh(m.get("manzil")),
                bosh(m.get("telefon")), bosh(m.get("ishBoshlanishi")), bosh(m.get("ishTugashi")), id) > 0;
    }

    /** Obunani oy soniga uzaytiradi; tugagan bo'lsa bugundan boshlab (botdagi kabi). */
    public LocalDate obunaUzaytir(long dorixonaId, int oylar) {
        List<Date> joriy = jdbc.queryForList("SELECT shartnoma_tugash FROM dorixona WHERE id = ?", Date.class, dorixonaId);
        if (joriy.isEmpty()) return null;
        LocalDate bugun = LocalDate.now();
        LocalDate eski = joriy.get(0) == null ? null : joriy.get(0).toLocalDate();
        LocalDate yangi = (eski == null || eski.isBefore(bugun) ? bugun : eski).plusMonths(oylar);
        jdbc.update("""
                UPDATE dorixona SET shartnoma_tugash = ?, holat = 'faol',
                       shartnoma_boshlanish = COALESCE(shartnoma_boshlanish, ?)
                WHERE id = ?
                """, Date.valueOf(yangi), Date.valueOf(bugun), dorixonaId);
        return yangi;
    }

    /** Dorixonani hamma bog'liq yozuvlari bilan o'chiradi (botdagi tartibda). */
    @Transactional
    public boolean dorixonaOchir(long id) {
        jdbc.update("DELETE FROM ombor_harakat WHERE dori_id IN (SELECT id FROM dori WHERE dorixona_id = ?)", id);
        jdbc.update("DELETE FROM bron WHERE dorixona_id = ?", id);
        jdbc.update("DELETE FROM dorixona_soov WHERE dorixona_id = ?", id);
        jdbc.update("DELETE FROM dori WHERE dorixona_id = ?", id);
        return jdbc.update("DELETE FROM dorixona WHERE id = ?", id) > 0;
    }

    /**
     * Foydalanuvchining dorixonasi. Avval egasi sifatida biriktirilgani qidiriladi; bo'lmasa —
     * telefon raqami (Telegram tasdiqlagan) dorixonaning raqamiga mos kelgani. Mos kelsa,
     * foydalanuvchi o'sha dorixonaga egasi qilib biriktiriladi: shunda dorixonalar boti ham
     * uni egasi deb taniydi. Boshqa egaga biriktirilgan dorixonaga tegilmaydi.
     */
    @Transactional
    public Long egasiDorixonasiId(long telegramId, String telefon) {
        List<Long> own = jdbc.queryForList(
                "SELECT id FROM dorixona WHERE egasi_telegram_id = ? ORDER BY id LIMIT 1", Long.class, telegramId);
        if (!own.isEmpty()) return own.get(0);
        String raqam = oxirgi9(telefon);
        if (raqam == null) return null;
        List<Long> mos = jdbc.queryForList("""
                SELECT id FROM dorixona
                WHERE egasi_telegram_id IS NULL
                  AND RIGHT(regexp_replace(COALESCE(telefon, ''), '[^0-9]', '', 'g'), 9) = ?
                ORDER BY id
                """, Long.class, raqam);
        for (Long id : mos) {
            if (jdbc.update("UPDATE dorixona SET egasi_telegram_id = ? WHERE id = ? AND egasi_telegram_id IS NULL",
                    telegramId, id) > 0) {
                return id;
            }
        }
        return null;
    }

    /** Telefon raqamining oxirgi 9 raqami (+998 / 8 / bo'shliqlardan qat'i nazar solishtirish uchun). */
    private static String oxirgi9(String telefon) {
        if (telefon == null) return null;
        String d = telefon.replaceAll("[^0-9]", "");
        return d.length() < 9 ? null : d.substring(d.length() - 9);
    }

    /** Dorixona obunasi haqida qisqa ma'lumot (dorixonachi "Obunam" bo'limi). */
    public Map<String, Object> obuna(long dorixonaId) {
        Map<String, Object> row = jdbc.queryForMap(
                "SELECT shartnoma_boshlanish, shartnoma_tugash, holat FROM dorixona WHERE id = ?", dorixonaId);
        Date tugash = (Date) row.get("shartnoma_tugash");
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("boshlanish", row.get("shartnoma_boshlanish") == null ? null : row.get("shartnoma_boshlanish").toString());
        m.put("tugash", tugash == null ? null : tugash.toString());
        m.put("holat", row.get("holat"));
        m.put("kunlarQoldi", tugash == null ? null
                : java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), tugash.toLocalDate()));
        return m;
    }

    // ——— Dorilar ———

    /**
     * Dorini o'chiradi. dorixonaId berilsa, faqat shu dorixonaniki o'chadi (dorixonachi
     * birovning mahsulotiga tegolmaydi). Ombor harakatlari va bronlari ham o'chadi —
     * aks holda kirim yozilgan mahsulotni o'chirib bo'lmasdi.
     */
    @Transactional
    public boolean doriOchir(long doriId, Long dorixonaId) {
        if (dorixonaId != null && !doriDorixonaniki(doriId, dorixonaId)) return false;
        jdbc.update("DELETE FROM ombor_harakat WHERE dori_id = ?", doriId);
        jdbc.update("DELETE FROM bron WHERE dori_id = ?", doriId);
        return jdbc.update("DELETE FROM dori WHERE id = ?", doriId) > 0;
    }

    public boolean doriDorixonaniki(long doriId, long dorixonaId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM dori WHERE id = ? AND dorixona_id = ?",
                Integer.class, doriId, dorixonaId);
        return n != null && n > 0;
    }

    // ——— Bronlar ———

    /**
     * Bron holatini o'zgartiradi — faqat ruxsat etilgan o'tishlar (YANGI → TAYYOR → BERILDI,
     * bekor qilish faqat berilmagan bronda). mijozga_xabar tushiriladi: mijozlar boti mijozga
     * o'zgarishni aytadi. "Berildi" bo'lganda ombordan chiqim yoziladi (hisob yuritilsa).
     */
    @Transactional
    public Map<String, Object> bronHolat(long bronId, Long dorixonaId, String yangi) {
        String oldingi = switch (yangi) {
            case TAYYOR -> "'YANGI'";
            case BERILDI -> "'TAYYOR'";
            case BEKOR -> "'YANGI', 'TAYYOR'";
            default -> null;
        };
        Map<String, Object> javob = new LinkedHashMap<>();
        if (oldingi == null) {
            javob.put("ok", false);
            javob.put("xato", "Noma'lum holat");
            return javob;
        }
        String shart = dorixonaId == null ? "" : " AND dorixona_id = " + dorixonaId;
        int n = jdbc.update("UPDATE bron SET holat = ?, mijozga_xabar = FALSE WHERE id = ?" + shart
                + " AND holat IN (" + oldingi + ")", yangi, bronId);
        if (n == 0) {
            javob.put("ok", false);
            javob.put("xato", "Bron holati allaqachon o'zgargan — sahifani yangilang");
            return javob;
        }
        javob.put("ok", true);
        javob.put("holat", yangi);
        if (BERILDI.equals(yangi)) {
            Map<String, Object> b = jdbc.queryForMap(
                    "SELECT b.dori_id, b.soni, d.narx FROM bron b JOIN dori d ON d.id = b.dori_id WHERE b.id = ?", bronId);
            long doriId = ((Number) b.get("dori_id")).longValue();
            int soni = ((Number) b.get("soni")).intValue();
            Double narx = b.get("narx") == null ? null : ((Number) b.get("narx")).doubleValue();
            Integer kirimlar = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM ombor_harakat WHERE dori_id = ? AND turi = 'KIRIM'", Integer.class, doriId);
            if (kirimlar != null && kirimlar > 0 && !omborService.chiqim(doriId, soni, narx, "bron №" + bronId)) {
                javob.put("ogohlantirish", "Omborda qoldiq yetmadi — chiqim yozilmadi. Kirimni tekshiring.");
            }
        }
        return javob;
    }

    /** Admin uchun barcha bronlar (avval faollari), dorixona nomi bilan. */
    public List<Map<String, Object>> barchaBronlar() {
        return jdbc.queryForList("""
                SELECT b.id, b.kod, b.holat, b.soni, b.tur, b.sana, b.mijoz_ismi, b.mijoz_telefon,
                       d.nomi AS dori_nomi, d.narx, p.nomi AS dorixona_nomi
                FROM bron b
                JOIN dori d ON d.id = b.dori_id
                JOIN dorixona p ON p.id = b.dorixona_id
                ORDER BY CASE WHEN b.holat IN ('YANGI', 'TAYYOR') THEN 0 ELSE 1 END, b.sana DESC
                LIMIT 300
                """);
    }

    // ——— Statistika ———

    /** Botlardagi "📊 Statistika" bilan bir xil ko'rsatkichlar va sayt uchun qo'shimchalari. */
    public Map<String, Object> statistika() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("dorixonalar", son("SELECT COUNT(*) FROM dorixona"));
        m.put("egasiUlangan", son("SELECT COUNT(*) FROM dorixona WHERE egasi_telegram_id IS NOT NULL"));
        m.put("faolObunalar", son("SELECT COUNT(*) FROM dorixona WHERE shartnoma_tugash >= CURRENT_DATE"));
        m.put("kutilayotganArizalar", son("SELECT COUNT(*) FROM dorixona_soov WHERE holat = 'KUTILMOQDA'"));
        m.put("foydalanuvchilar", son("SELECT COUNT(*) FROM bot_user"));
        m.put("dorilar", son("SELECT COUNT(*) FROM dori"));
        m.put("katalog", son("SELECT COUNT(*) FROM dori_katalog"));
        m.put("faolBronlar", son("SELECT COUNT(*) FROM bron WHERE holat IN ('YANGI', 'TAYYOR')"));
        m.put("jamiBronlar", son("SELECT COUNT(*) FROM bron"));
        return m;
    }

    private long son(String sql) {
        Long n = jdbc.queryForObject(sql, Long.class);
        return n == null ? 0 : n;
    }

    private static String bosh(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
