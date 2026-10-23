package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Dori yetkazib berish (1-bosqich).
 *
 * <p>Dorini dorixonaning o'zi yetkazadi (o'z kuryeri yoki Yandex Go orqali) — sayt faqat buyurtmani qabul qilib,
 * dorixonaga yetkazadi. Mijozdan sayt hech qanday haq olmaydi: mijoz dori va yetkazish narxini dorixonaga to'laydi.
 *
 * <p>Botlar bilan aloqa — bron kabi umumiy jadval orqali: {@code egaga_xabar = FALSE} + {@code egaga_hodisa}
 * (YANGI | CHEK | BEKOR_MIJOZ) — dorixonalar boti egasiga yetkazadi; {@code mijozga_xabar = FALSE} +
 * {@code mijoz_hodisa} (QABUL | YOLDA | YETKAZILDI | BEKOR | TOLOV) — mijozlar boti mijozga aytadi.
 * Jadval tuzilishi dorixonalar botidagi bilan bir xil (ikkalasi ham CREATE TABLE IF NOT EXISTS).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class YetkazishService {

    public static final String YANGI = "YANGI", QABUL = "QABUL", YOLDA = "YOLDA", YETKAZILDI = "YETKAZILDI", BEKOR = "BEKOR";
    public static final String NAQD = "NAQD", KARTA = "KARTA";
    /** Taxminiy yo'l masofasi: to'g'ri chiziq masofasi × shu koeffitsient (ko'chalar to'g'ri emas). */
    private static final double YOL_KOEFF = 1.25;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbc;
    private final DoriRepository doriRepository;
    private final OmborService omborService;

    // ---------------------------------------------------------------- jadvallar

    @Order(1)
    @EventListener(ApplicationReadyEvent.class)
    public void jadvallar() {
        try {
            jdbc.execute("""
                    CREATE TABLE IF NOT EXISTS yetkazish (
                        id BIGSERIAL PRIMARY KEY,
                        dorixona_id BIGINT NOT NULL,
                        mijoz_telegram_id BIGINT,
                        mijoz_ismi VARCHAR(200),
                        mijoz_telefon VARCHAR(40),
                        manzil VARCHAR(500) NOT NULL,
                        izoh VARCHAR(500),
                        latitude DOUBLE PRECISION,
                        longitude DOUBLE PRECISION,
                        masofa_km DOUBLE PRECISION,
                        dori_summa DOUBLE PRECISION NOT NULL DEFAULT 0,
                        yetkazish_narxi DOUBLE PRECISION NOT NULL DEFAULT 0,
                        tolov_usuli VARCHAR(20) NOT NULL DEFAULT 'NAQD',
                        tolov_holati VARCHAR(20),
                        tolov_cheki BYTEA,
                        holat VARCHAR(20) NOT NULL DEFAULT 'YANGI',
                        bekor_sababi VARCHAR(300),
                        kuryer_telefon VARCHAR(40),
                        taxminiy_daqiqa INTEGER,
                        kod VARCHAR(10),
                        egaga_xabar BOOLEAN NOT NULL DEFAULT FALSE,
                        egaga_hodisa VARCHAR(20),
                        mijozga_xabar BOOLEAN NOT NULL DEFAULT TRUE,
                        mijoz_hodisa VARCHAR(20),
                        chiqim_yozildi BOOLEAN NOT NULL DEFAULT FALSE,
                        sana TIMESTAMP NOT NULL DEFAULT NOW(),
                        yangilandi TIMESTAMP
                    )""");
            jdbc.execute("""
                    CREATE TABLE IF NOT EXISTS yetkazish_qator (
                        id BIGSERIAL PRIMARY KEY,
                        yetkazish_id BIGINT NOT NULL REFERENCES yetkazish(id) ON DELETE CASCADE,
                        dori_id BIGINT,
                        nomi VARCHAR(500) NOT NULL,
                        soni INTEGER NOT NULL,
                        tur VARCHAR(10) NOT NULL DEFAULT 'dona',
                        narx DOUBLE PRECISION NOT NULL DEFAULT 0
                    )""");
            jdbc.execute("CREATE INDEX IF NOT EXISTS yetkazish_dorixona_idx ON yetkazish (dorixona_id, sana)");
            jdbc.execute("CREATE INDEX IF NOT EXISTS yetkazish_mijoz_idx ON yetkazish (mijoz_telegram_id, sana)");
            jdbc.execute("CREATE INDEX IF NOT EXISTS yetkazish_egaga_idx ON yetkazish (id) WHERE egaga_xabar = FALSE");
            jdbc.execute("CREATE INDEX IF NOT EXISTS yetkazish_mijozga_idx ON yetkazish (id) WHERE mijozga_xabar = FALSE");
            jdbc.execute("CREATE INDEX IF NOT EXISTS yetkazish_qator_idx ON yetkazish_qator (yetkazish_id)");
            // Dorixonaning yetkazish sozlamalari (dorixonaning o'zi panel yoki botda belgilaydi).
            for (String ustun : List.of(
                    "yetkazish_yoqilgan BOOLEAN DEFAULT FALSE",
                    "yetkazish_narxi DOUBLE PRECISION DEFAULT 0",
                    "yetkazish_km_narxi DOUBLE PRECISION DEFAULT 0",
                    "yetkazish_bepul_chegara DOUBLE PRECISION DEFAULT 0",
                    "yetkazish_min_summa DOUBLE PRECISION DEFAULT 0",
                    "yetkazish_radius_km DOUBLE PRECISION DEFAULT 5",
                    "yetkazish_naqd BOOLEAN DEFAULT TRUE")) {
                jdbc.execute("ALTER TABLE dorixona ADD COLUMN IF NOT EXISTS " + ustun);
            }
        } catch (Exception e) {
            log.warn("Yetkazish jadvallarini tayyorlab bo'lmadi: {}", e.getMessage());
        }
    }

    // ---------------------------------------------------------------- sozlamalar

    public Map<String, Object> sozlama(long dorixonaId) {
        Map<String, Object> s = jdbc.queryForMap("""
                SELECT COALESCE(yetkazish_yoqilgan, FALSE) AS yoqilgan, COALESCE(yetkazish_narxi, 0) AS narx,
                       COALESCE(yetkazish_km_narxi, 0) AS km_narxi, COALESCE(yetkazish_bepul_chegara, 0) AS bepul_chegara,
                       COALESCE(yetkazish_min_summa, 0) AS min_summa, COALESCE(yetkazish_radius_km, 5) AS radius_km,
                       COALESCE(yetkazish_naqd, TRUE) AS naqd, karta_raqami, latitude, longitude
                FROM dorixona WHERE id = ?""", dorixonaId);
        return new LinkedHashMap<>(s);
    }

    public Map<String, Object> sozlamaYoz(long dorixonaId, Map<String, Object> body) {
        boolean yoqilgan = Boolean.TRUE.equals(body.get("yoqilgan"));
        double narx = musbat(body.get("narx"), 1_000_000);
        double kmNarxi = musbat(body.get("km_narxi"), 100_000);
        double bepul = musbat(body.get("bepul_chegara"), 100_000_000);
        double min = musbat(body.get("min_summa"), 100_000_000);
        double radius = Math.max(0.5, Math.min(50, musbat(body.get("radius_km"), 50)));
        boolean naqd = !Boolean.FALSE.equals(body.get("naqd"));
        Object karta = body.get("karta_raqami");
        String kartaRaqami = karta == null ? null : karta.toString().replaceAll("[^0-9 ]", "").trim();
        if (kartaRaqami != null && kartaRaqami.replace(" ", "").length() > 19) {
            throw new IllegalArgumentException("Karta raqami noto'g'ri");
        }
        if (yoqilgan) {
            Map<String, Object> joy = jdbc.queryForMap("SELECT latitude, longitude FROM dorixona WHERE id = ?", dorixonaId);
            if (joy.get("latitude") == null || joy.get("longitude") == null) {
                throw new IllegalArgumentException("Avval dorixonaning xaritadagi joylashuvini kiriting — masofa shundan hisoblanadi");
            }
            if (!naqd && (kartaRaqami == null || kartaRaqami.isBlank())) {
                throw new IllegalArgumentException("Naqd to'lov o'chirilgan bo'lsa, karta raqamini kiriting");
            }
        }
        jdbc.update("""
                UPDATE dorixona SET yetkazish_yoqilgan = ?, yetkazish_narxi = ?, yetkazish_km_narxi = ?,
                       yetkazish_bepul_chegara = ?, yetkazish_min_summa = ?, yetkazish_radius_km = ?, yetkazish_naqd = ?,
                       karta_raqami = COALESCE(?, karta_raqami)
                WHERE id = ?""", yoqilgan, narx, kmNarxi, bepul, min, radius, naqd,
                kartaRaqami == null || kartaRaqami.isBlank() ? null : kartaRaqami, dorixonaId);
        return sozlama(dorixonaId);
    }

    private static double musbat(Object v, double max) {
        if (v == null || v.toString().isBlank()) return 0;
        double d;
        try {
            d = Double.parseDouble(v.toString().replace(" ", "").replace(",", "."));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Son noto'g'ri: " + v);
        }
        if (d < 0 || d > max || Double.isNaN(d)) throw new IllegalArgumentException("Son chegaradan tashqarida: " + v);
        return d;
    }

    // ---------------------------------------------------------------- narx

    /** Yetkazish mumkinmi va narxi qancha — savatchada manzil tanlanganda ko'rsatiladi. */
    public Map<String, Object> narx(long dorixonaId, Double lat, Double lon, double doriSumma) {
        Map<String, Object> s = jdbc.queryForList("""
                SELECT nomi, holat, shartnoma_tugash, latitude, longitude, ish_boshlanishi, ish_tugashi, karta_raqami,
                       COALESCE(yetkazish_yoqilgan, FALSE) AS yoqilgan, COALESCE(yetkazish_narxi, 0) AS narx,
                       COALESCE(yetkazish_km_narxi, 0) AS km_narxi, COALESCE(yetkazish_bepul_chegara, 0) AS bepul_chegara,
                       COALESCE(yetkazish_min_summa, 0) AS min_summa, COALESCE(yetkazish_radius_km, 5) AS radius_km,
                       COALESCE(yetkazish_naqd, TRUE) AS naqd
                FROM dorixona WHERE id = ?""", dorixonaId).stream().findFirst().orElse(null);
        Map<String, Object> j = new LinkedHashMap<>();
        if (s == null || !faol(s) || !Boolean.TRUE.equals(s.get("yoqilgan"))
                || s.get("latitude") == null || s.get("longitude") == null) {
            j.put("mumkin", false);
            j.put("sabab", "Bu dorixona hozircha yetkazib bermaydi");
            return j;
        }
        List<String> usullar = new ArrayList<>();
        if (Boolean.TRUE.equals(s.get("naqd"))) usullar.add(NAQD);
        if (s.get("karta_raqami") != null && !s.get("karta_raqami").toString().isBlank()) usullar.add(KARTA);
        j.put("tolovUsullari", usullar);
        j.put("minSumma", son(s.get("min_summa")));
        j.put("bepulChegara", son(s.get("bepul_chegara")));
        j.put("radiusKm", son(s.get("radius_km")));
        if (lat == null || lon == null) {
            j.put("mumkin", false);
            j.put("sabab", "Manzilni xaritada belgilang");
            return j;
        }
        double km = Math.round(masofaKm(son(s.get("latitude")), son(s.get("longitude")), lat, lon) * YOL_KOEFF * 10) / 10.0;
        j.put("masofaKm", km);
        if (km > son(s.get("radius_km"))) {
            j.put("mumkin", false);
            j.put("sabab", "Manzil yetkazish hududidan tashqarida (dorixona " + fmt(son(s.get("radius_km"))) + " km gacha yetkazadi)");
            return j;
        }
        if (doriSumma < son(s.get("min_summa"))) {
            j.put("mumkin", false);
            j.put("sabab", "Yetkazish uchun eng kam buyurtma: " + fmt(son(s.get("min_summa"))) + " so'm");
            return j;
        }
        double narx;
        double bepul = son(s.get("bepul_chegara"));
        if (bepul > 0 && doriSumma >= bepul) {
            narx = 0;
        } else {
            narx = son(s.get("narx")) + son(s.get("km_narxi")) * km;
            narx = Math.ceil(narx / 500.0) * 500; // 500 so'mga yaxlitlanadi
        }
        j.put("mumkin", true);
        j.put("narx", narx);
        j.put("jami", doriSumma + narx);
        return j;
    }

    private static boolean faol(Map<String, Object> dx) {
        Object holat = dx.get("holat");
        if (holat != null && "nofaol".equalsIgnoreCase(holat.toString())) return false;
        Object tugash = dx.get("shartnoma_tugash");
        return tugash == null || !java.sql.Date.valueOf(tugash.toString().substring(0, 10)).toLocalDate()
                .isBefore(java.time.LocalDate.now());
    }

    static double masofaKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1), dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private static double son(Object v) {
        return v == null ? 0 : ((Number) v).doubleValue();
    }

    private static String fmt(double d) {
        return String.format(java.util.Locale.ROOT, "%,.0f", d).replace(',', ' ');
    }

    // ---------------------------------------------------------------- buyurtma

    public record Qator(Long doriId, int soni, String tur) { }

    public record Sorov(Long dorixonaId, List<Qator> qatorlar, String manzil, String izoh,
                        Double latitude, Double longitude, String tolovUsuli) { }

    @Transactional
    public Map<String, Object> buyurtmaBer(User mijoz, Sorov s) {
        if (s.dorixonaId() == null || s.qatorlar() == null || s.qatorlar().isEmpty()) {
            throw new IllegalArgumentException("Savatcha bo'sh");
        }
        if (s.qatorlar().size() > 30) throw new IllegalArgumentException("Bir buyurtmada 30 tadan ko'p mahsulot bo'lmaydi");
        String manzil = s.manzil() == null ? "" : s.manzil().trim();
        if (manzil.length() < 5) throw new IllegalArgumentException("Manzilni to'liq yozing (ko'cha, uy, xonadon)");
        if (manzil.length() > 500) manzil = manzil.substring(0, 500);
        String izoh = s.izoh() == null ? null : s.izoh().trim();
        if (izoh != null && izoh.length() > 500) izoh = izoh.substring(0, 500);
        String usul = KARTA.equals(s.tolovUsuli()) ? KARTA : NAQD;

        // Narx va mahsulot har doim bazadan olinadi — brauzer yuborgan narxga ishonilmaydi.
        double summa = 0;
        List<Object[]> qatorlar = new ArrayList<>();
        for (Qator q : s.qatorlar()) {
            if (q.doriId() == null || q.soni() <= 0 || q.soni() > 99) throw new IllegalArgumentException("Mahsulot soni noto'g'ri");
            var dori = doriRepository.findById(q.doriId())
                    .orElseThrow(() -> new IllegalArgumentException("Mahsulot topilmadi (№" + q.doriId() + ")"));
            if (!s.dorixonaId().equals(dori.getDorixonaId())) {
                throw new IllegalArgumentException("Bitta buyurtmadagi mahsulotlar bitta dorixonadan bo'lishi kerak");
            }
            if (Boolean.FALSE.equals(dori.getAvailable())) {
                throw new IllegalStateException("«" + dori.getName() + "» hozir mavjud emas");
            }
            if (retseptlimi(dori.getName())) {
                throw new IllegalStateException("«" + dori.getName() + "» retsept bilan beriladi — uni faqat dorixonadan olib ketish mumkin");
            }
            String tur = "pachka".equals(q.tur()) ? "pachka" : "dona";
            Double narx = "pachka".equals(tur) && dori.getPachkaNarx() != null && dori.getPachkaNarx() > 0
                    ? dori.getPachkaNarx() : dori.getPrice();
            if (narx == null || narx <= 0) throw new IllegalStateException("«" + dori.getName() + "» narxi ko'rsatilmagan");
            Map<Long, long[]> ombor = omborService.qoldiqlar(List.of(dori.getId()));
            if (ombor.containsKey(dori.getId()) && ombor.get(dori.getId())[1] > 0 && ombor.get(dori.getId())[0] < q.soni()) {
                throw new IllegalStateException("«" + dori.getName() + "»: omborda faqat " + Math.max(0, ombor.get(dori.getId())[0]) + " ta bor");
            }
            summa += narx * q.soni();
            qatorlar.add(new Object[]{dori.getId(), dori.getName(), q.soni(), tur, narx});
        }

        Map<String, Object> n = narx(s.dorixonaId(), s.latitude(), s.longitude(), summa);
        if (!Boolean.TRUE.equals(n.get("mumkin"))) throw new IllegalStateException(String.valueOf(n.get("sabab")));
        @SuppressWarnings("unchecked")
        List<String> usullar = (List<String>) n.get("tolovUsullari");
        if (!usullar.contains(usul)) {
            throw new IllegalStateException(KARTA.equals(usul)
                    ? "Bu dorixona kartaga oldindan to'lovni qabul qilmaydi" : "Bu dorixona faqat oldindan kartaga to'lovni qabul qiladi");
        }
        double yetkazishNarxi = son(n.get("narx"));
        String kod = String.valueOf(100000 + RANDOM.nextInt(900000));

        GeneratedKeyHolder kalit = new GeneratedKeyHolder();
        final String manzilF = manzil, izohF = izoh;
        final double summaF = summa;
        jdbc.update(c -> {
            PreparedStatement ps = c.prepareStatement("""
                    INSERT INTO yetkazish (dorixona_id, mijoz_telegram_id, mijoz_ismi, mijoz_telefon, manzil, izoh,
                        latitude, longitude, masofa_km, dori_summa, yetkazish_narxi, tolov_usuli, tolov_holati,
                        holat, kod, egaga_xabar, egaga_hodisa, mijozga_xabar, sana)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'YANGI', ?, FALSE, 'YANGI', TRUE, NOW())""",
                    Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, s.dorixonaId());
            ps.setLong(2, mijoz.getId());
            ps.setString(3, mijoz.getName());
            ps.setString(4, mijoz.getPhoneNumber());
            ps.setString(5, manzilF);
            ps.setString(6, izohF);
            ps.setDouble(7, s.latitude());
            ps.setDouble(8, s.longitude());
            ps.setDouble(9, son(n.get("masofaKm")));
            ps.setDouble(10, summaF);
            ps.setDouble(11, yetkazishNarxi);
            ps.setString(12, usul);
            ps.setString(13, KARTA.equals(usul) ? "KUTILMOQDA" : null);
            ps.setString(14, kod);
            return ps;
        }, kalit);
        long id = ((Number) kalit.getKeys().get("id")).longValue();
        List<Object[]> yoziladi = qatorlar.stream().map(q -> new Object[]{id, q[0], q[1], q[2], q[3], q[4]}).toList();
        jdbc.batchUpdate("INSERT INTO yetkazish_qator (yetkazish_id, dori_id, nomi, soni, tur, narx) VALUES (?, ?, ?, ?, ?, ?)", yoziladi);

        Map<String, Object> j = new LinkedHashMap<>(bitta(id));
        if (KARTA.equals(usul)) {
            j.put("kartaRaqami", jdbc.queryForObject("SELECT karta_raqami FROM dorixona WHERE id = ?", String.class, s.dorixonaId()));
        }
        return j;
    }

    /** Dori yo'riqnomasida retseptli deb belgilangan bo'lsa — yetkazilmaydi (faqat olib ketish). */
    private boolean retseptlimi(String nomi) {
        try {
            String kalit = com.example.dori_qidiruv_bot.util.DoriKalit.kalit(nomi);
            List<String> m = jdbc.queryForList(
                    "SELECT malumot FROM dori_malumot WHERE kalit = ? AND holat = 'TAYYOR'", String.class, kalit);
            return !m.isEmpty() && m.get(0) != null && m.get(0).replace(" ", "").contains("\"retseptli\":true");
        } catch (Exception e) {
            return false; // ma'lumotnoma jadvali bo'lmasa — dorixona o'zi tekshiradi
        }
    }

    // ---------------------------------------------------------------- mijoz

    public List<Map<String, Object>> mening(User mijoz) {
        List<Long> idlar = jdbc.queryForList(
                "SELECT id FROM yetkazish WHERE mijoz_telegram_id = ? ORDER BY id DESC LIMIT 30", Long.class, mijoz.getId());
        return idlar.stream().map(this::bitta).toList();
    }

    public Map<String, Object> chekYukla(User mijoz, long id, byte[] rasm) {
        int n = jdbc.update("""
                UPDATE yetkazish SET tolov_cheki = ?, tolov_holati = 'CHEK_YUBORILDI', egaga_xabar = FALSE,
                       egaga_hodisa = 'CHEK', yangilandi = NOW()
                WHERE id = ? AND mijoz_telegram_id = ? AND tolov_usuli = 'KARTA'
                  AND tolov_holati IN ('KUTILMOQDA', 'CHEK_YUBORILDI') AND holat IN ('YANGI', 'QABUL')""",
                rasm, id, mijoz.getId());
        if (n == 0) throw new IllegalStateException("Bu buyurtmaga chek yuklab bo'lmaydi");
        return bitta(id);
    }

    public Map<String, Object> mijozBekorQil(User mijoz, long id) {
        int n = jdbc.update("""
                UPDATE yetkazish SET holat = 'BEKOR', bekor_sababi = 'Mijoz bekor qildi', egaga_xabar = FALSE,
                       egaga_hodisa = 'BEKOR_MIJOZ', yangilandi = NOW()
                WHERE id = ? AND mijoz_telegram_id = ? AND holat = 'YANGI'""", id, mijoz.getId());
        if (n == 0) throw new IllegalStateException("Dorixona buyurtmani qabul qilgan — bekor qilish uchun dorixonaga qo'ng'iroq qiling");
        return bitta(id);
    }

    // ---------------------------------------------------------------- dorixona

    public List<Map<String, Object>> dorixonaniki(long dorixonaId) {
        List<Long> idlar = jdbc.queryForList("""
                SELECT id FROM yetkazish WHERE dorixona_id = ?
                ORDER BY CASE WHEN holat IN ('YANGI', 'QABUL', 'YOLDA') THEN 0 ELSE 1 END, id DESC LIMIT 50""",
                Long.class, dorixonaId);
        return idlar.stream().map(this::bitta).toList();
    }

    public List<Map<String, Object>> barchasi() {
        List<Long> idlar = jdbc.queryForList("SELECT id FROM yetkazish ORDER BY id DESC LIMIT 100", Long.class);
        return idlar.stream().map(this::bitta).toList();
    }

    /**
     * Dorixona holatni o'zgartiradi. Ruxsat etilgan o'tishlar: YANGI → QABUL → YOLDA → YETKAZILDI,
     * bekor — yetkazilmagan buyurtmada. Mijozga dori_UzBot orqali xabar boradi (mijozga_xabar = FALSE).
     * Yetkazilganda ombor hisobi yuritilayotgan mahsulotlar uchun chiqim yoziladi (bir marta).
     */
    @Transactional
    public Map<String, Object> holat(long id, Long dorixonaId, String yangi, Integer daqiqa, String kuryerTelefon, String sabab) {
        String oldingi = switch (yangi) {
            case QABUL -> "'YANGI'";
            case YOLDA -> "'QABUL'";
            case YETKAZILDI -> "'QABUL', 'YOLDA'";
            case BEKOR -> "'YANGI', 'QABUL', 'YOLDA'";
            default -> null;
        };
        if (oldingi == null) throw new IllegalArgumentException("Noma'lum holat");
        String shart = dorixonaId == null ? "" : " AND dorixona_id = " + dorixonaId;
        String tel = kuryerTelefon == null || kuryerTelefon.isBlank() ? null : kuryerTelefon.replaceAll("[^0-9+ ]", "").trim();
        String sab = sabab == null || sabab.isBlank() ? null : sabab.trim().substring(0, Math.min(300, sabab.trim().length()));
        Integer daq = daqiqa == null || daqiqa <= 0 ? null : Math.min(daqiqa, 600);
        int n = jdbc.update("UPDATE yetkazish SET holat = ?, mijozga_xabar = FALSE, mijoz_hodisa = ?, yangilandi = NOW(), "
                        + "taxminiy_daqiqa = COALESCE(?, taxminiy_daqiqa), kuryer_telefon = COALESCE(?, kuryer_telefon), "
                        + "bekor_sababi = COALESCE(?, bekor_sababi) "
                        + "WHERE id = ?" + shart + " AND holat IN (" + oldingi + ")",
                yangi, yangi, daq, tel, BEKOR.equals(yangi) ? (sab == null ? "Dorixona buyurtmani bajara olmadi" : sab) : null, id);
        if (n == 0) throw new IllegalStateException("Buyurtma holati allaqachon o'zgargan — sahifani yangilang");
        Map<String, Object> j = new LinkedHashMap<>(bitta(id));
        if (YETKAZILDI.equals(yangi)) {
            String ogoh = chiqimYoz(id);
            if (ogoh != null) j.put("ogohlantirish", ogoh);
        }
        return j;
    }

    /** Kartaga to'lov tekshirildi — mijozga "to'lov tasdiqlandi" xabari boradi. */
    public Map<String, Object> tolovTasdiqla(long id, Long dorixonaId) {
        String shart = dorixonaId == null ? "" : " AND dorixona_id = " + dorixonaId;
        int n = jdbc.update("UPDATE yetkazish SET tolov_holati = 'TASDIQLANDI', mijozga_xabar = FALSE, mijoz_hodisa = 'TOLOV', "
                + "yangilandi = NOW() WHERE id = ?" + shart + " AND tolov_usuli = 'KARTA' AND tolov_holati = 'CHEK_YUBORILDI'", id);
        if (n == 0) throw new IllegalStateException("To'lov cheki hali yuborilmagan yoki allaqachon tasdiqlangan");
        return bitta(id);
    }

    public byte[] chek(long id, Long dorixonaId, Long mijozId) {
        StringBuilder sql = new StringBuilder("SELECT tolov_cheki FROM yetkazish WHERE id = ?");
        List<Object> args = new ArrayList<>(List.of(id));
        if (dorixonaId != null) { sql.append(" AND dorixona_id = ?"); args.add(dorixonaId); }
        if (mijozId != null) { sql.append(" AND mijoz_telegram_id = ?"); args.add(mijozId); }
        List<byte[]> q = jdbc.query(sql.toString(), (rs, i) -> rs.getBytes(1), args.toArray());
        return q.isEmpty() ? null : q.get(0);
    }

    /** Yetkazilgan mahsulotlar uchun ombor chiqimi — faqat bir marta (chiqim_yozildi bayrog'i). */
    private String chiqimYoz(long id) {
        if (jdbc.update("UPDATE yetkazish SET chiqim_yozildi = TRUE WHERE id = ? AND chiqim_yozildi = FALSE", id) == 0) return null;
        List<String> yetmadi = new ArrayList<>();
        for (Map<String, Object> q : jdbc.queryForList(
                "SELECT dori_id, nomi, soni, narx FROM yetkazish_qator WHERE yetkazish_id = ? AND dori_id IS NOT NULL", id)) {
            long doriId = ((Number) q.get("dori_id")).longValue();
            Integer kirimlar = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM ombor_harakat WHERE dori_id = ? AND turi = 'KIRIM'", Integer.class, doriId);
            if (kirimlar == null || kirimlar == 0) continue;
            if (!omborService.chiqim(doriId, ((Number) q.get("soni")).intValue(), son(q.get("narx")), "yetkazish №" + id)) {
                yetmadi.add(String.valueOf(q.get("nomi")));
            }
        }
        return yetmadi.isEmpty() ? null : "Omborda qoldiq yetmadi, chiqim yozilmadi: " + String.join(", ", yetmadi);
    }

    // ---------------------------------------------------------------- javob ko'rinishi

    private static final Set<String> CHIQMAYDI = Set.of("tolov_cheki", "egaga_xabar", "mijozga_xabar", "chiqim_yozildi");

    public Map<String, Object> bitta(long id) {
        Map<String, Object> r = jdbc.queryForMap("""
                SELECT y.*, (y.tolov_cheki IS NOT NULL) AS chek_bor, p.nomi AS dorixona_nomi, p.telefon AS dorixona_telefon,
                       p.manzil AS dorixona_manzil
                FROM yetkazish y JOIN dorixona p ON p.id = y.dorixona_id WHERE y.id = ?""", id);
        Map<String, Object> j = new LinkedHashMap<>();
        r.forEach((k, v) -> { if (!CHIQMAYDI.contains(k)) j.put(k, v instanceof java.sql.Timestamp t ? t.toLocalDateTime().toString() : v); });
        j.put("jami", son(r.get("dori_summa")) + son(r.get("yetkazish_narxi")));
        j.put("qatorlar", jdbc.queryForList(
                "SELECT dori_id, nomi, soni, tur, narx FROM yetkazish_qator WHERE yetkazish_id = ? ORDER BY id", id));
        return j;
    }
}
