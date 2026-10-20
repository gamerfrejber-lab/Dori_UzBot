package com.example.dori_qidiruv_bot.service;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.core.JsonValue;
import com.anthropic.core.http.StreamResponse;
import com.anthropic.models.messages.ContentBlock;
import com.anthropic.models.messages.JsonOutputFormat;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.StopReason;
import com.anthropic.models.messages.batches.BatchCreateParams;
import com.anthropic.models.messages.batches.MessageBatch;
import com.anthropic.models.messages.batches.MessageBatchIndividualResponse;
import com.example.dori_qidiruv_bot.util.DoriKalit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Dori yo'riqnomalarini sun'iy intellekt (Claude, Message Batches API — yarim narxda) orqali yozadi.
 *
 * <p>Ish tartibi: katalog va dorixonalardagi dorilar asosiy nom bo'yicha guruhlanadi ({@link DoriKalit}),
 * har guruhga bitta qator. Har 10 daqiqada: yuborilgan to'plam tugagan bo'lsa natijalar saqlanadi,
 * aks holda navbatdagi 300 tasi yuboriladi. Yangi dori qo'shilsa sinxronlashda o'zi navbatga tushadi.
 *
 * <p>Rejim (sayt_sozlama.malumot_rejim): "ustuvor" — faqat sotuvdagi va saytda ochilgan dorilar,
 * "toliq" — butun katalog, "toxtatilgan" — hech narsa yuborilmaydi. ANTHROPIC_API_KEY bo'lmasa ishlamaydi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DoriMalumotService {

    static final String MODEL = "claude-opus-5-5";
    /** Message Batches narxi (oddiy narxning yarmi), 1 mln token uchun dollar. */
    private static final double KIRISH_NARXI = 2.0;
    private static final double CHIQISH_NARXI = 10.0;
    private static final int TOPLAM_HAJMI = 300;
    private static final int NAMUNA_SONI = 8;

    private final JdbcTemplate jdbc;
    private final SaytSozlama saytSozlama;
    private final ObjectMapper json = new ObjectMapper();

    @Value("${anthropic.api-key:}")
    private String apiKey;

    private volatile AnthropicClient client;

    // ---------------------------------------------------------------- sozlamalar

    public String sozlama(String kalit, String standart) {
        return saytSozlama.ol(kalit, standart);
    }

    public void sozlamaYoz(String kalit, String qiymat) {
        saytSozlama.yoz(kalit, qiymat);
    }

    public boolean kalitBormi() {
        return apiKey != null && !apiKey.isBlank();
    }

    private AnthropicClient client() {
        if (client == null) {
            synchronized (this) {
                if (client == null) client = AnthropicOkHttpClient.builder().fromEnv().apiKey(apiKey).build();
            }
        }
        return client;
    }

    // ---------------------------------------------------------------- sinxronlash

    private record Guruh(Set<String> namunalar, String ishlab, String davlat) { }

    /** Bir yo'la xotirada ushlanadigan guruhlar soni — shundan oshsa bazaga yozib, xotira bo'shatiladi. */
    private static final int GURUH_BOLAGI = 5000;

    /**
     * Katalog va dorixona dorilaridan yangi asosiy nomlarni jadvalga qo'shadi; sotuvdagilarni ustuvor qiladi.
     * Jadvallar o'zgarmagan bo'lsa (soni va oxirgi id bir xil) hech narsa qilinmaydi. Qatorlar oqim bilan
     * (fetchSize) o'qiladi va bo'laklab yoziladi — 1 mln qatorli jadval ham xotiraga to'liq yuklanmaydi.
     */
    @Scheduled(initialDelayString = "${malumot.sinxron-kechikish:90000}", fixedDelay = 30 * 60_000)
    public void sinxronla() {
        try {
            String belgi = jdbc.queryForObject("SELECT (SELECT COUNT(*) || ':' || COALESCE(MAX(id), 0) FROM dori_katalog) "
                    + "|| '/' || (SELECT COUNT(*) || ':' || COALESCE(MAX(id), 0) FROM dori)", String.class);
            if (belgi != null && belgi.equals(sozlama("malumot_sinxron_belgi", null))) return;

            JdbcTemplate oqim = new JdbcTemplate(jdbc.getDataSource());
            oqim.setFetchSize(2000);
            TransactionTemplate tx = new TransactionTemplate(new DataSourceTransactionManager(jdbc.getDataSource()));
            tx.setReadOnly(true);
            int[] qoshildi = {0};

            // Katalog nomi bo'yicha tartiblangan — bir asosiy nomdagi mahsulotlar ketma-ket keladi.
            tx.executeWithoutResult(st -> {
                Map<String, Guruh> guruhlar = new LinkedHashMap<>();
                oqim.query("SELECT nomi, ishlab_chiqaruvchi, davlat FROM dori_katalog ORDER BY nomi", rs -> {
                    qosh(guruhlar, rs.getString(1), rs.getString(2), rs.getString(3));
                    if (guruhlar.size() >= GURUH_BOLAGI) qoshildi[0] += yangilariniYoz(guruhlar, false);
                });
                qoshildi[0] += yangilariniYoz(guruhlar, false);
            });
            // Dorixonalardagi nomlar (takrorlarsiz) — bular "sotuvda", navbatda oldinda turadi.
            tx.executeWithoutResult(st -> {
                Map<String, Guruh> guruhlar = new LinkedHashMap<>();
                oqim.query("SELECT DISTINCT nomi, ishlab_chiqaruvchi FROM dori WHERE nomi IS NOT NULL ORDER BY nomi", rs -> {
                    qosh(guruhlar, rs.getString(1), rs.getString(2), null);
                    if (guruhlar.size() >= GURUH_BOLAGI) qoshildi[0] += yangilariniYoz(guruhlar, true);
                });
                qoshildi[0] += yangilariniYoz(guruhlar, true);
            });
            if (qoshildi[0] > 0) log.info("Dori ma'lumotnomasiga {} ta yangi nom qo'shildi.", qoshildi[0]);
            if (belgi != null) sozlamaYoz("malumot_sinxron_belgi", belgi);
        } catch (Exception e) {
            log.warn("Dori ma'lumotnomasini sinxronlab bo'lmadi: {}", e.getMessage());
        }
    }

    /** Guruhlarni bazaga yozadi (borlari o'tkazib yuboriladi) va xaritani tozalaydi. Qo'shilganlar sonini qaytaradi. */
    private int yangilariniYoz(Map<String, Guruh> guruhlar, boolean sotuvda) {
        if (guruhlar.isEmpty()) return 0;
        List<Object[]> qatorlar = new ArrayList<>(guruhlar.size());
        guruhlar.forEach((k, g) -> qatorlar.add(new Object[]{k, String.join("\n", g.namunalar()), g.ishlab(), g.davlat(),
                DoriKalit.doriEmasmi(k) ? "DORI_EMAS" : "KUTMOQDA", sotuvda ? 2 : 1}));
        int qoshildi = 0;
        for (int n : jdbc.batchUpdate("INSERT INTO dori_malumot (kalit, namunalar, ishlab_chiqaruvchi, davlat, holat, ustuvor, "
                + "urinish, tahrirlangan, yangilangan) VALUES (?, ?, ?, ?, ?, ?, 0, FALSE, NOW()) "
                + "ON CONFLICT (kalit) DO NOTHING", qatorlar)) {
            if (n > 0) qoshildi += n;
        }
        if (sotuvda) {
            jdbc.batchUpdate("UPDATE dori_malumot SET ustuvor = 2 WHERE kalit = ? AND ustuvor < 2",
                    guruhlar.keySet().stream().map(k -> new Object[]{k}).toList());
        }
        guruhlar.clear();
        return qoshildi;
    }

    private static void qosh(Map<String, Guruh> guruhlar, String nomi, String ishlab, String davlat) {
        String k = DoriKalit.kalit(nomi);
        if (k.isBlank()) return;
        Guruh g = guruhlar.computeIfAbsent(k, x -> new Guruh(new LinkedHashSet<>(),
                ishlab == null ? null : ishlab.trim(), davlat == null ? null : davlat.trim()));
        if (g.namunalar().size() < NAMUNA_SONI) {
            String q = nomi.trim()
                    + (ishlab != null && !ishlab.isBlank() ? " — " + ishlab.trim() : "")
                    + (davlat != null && !davlat.isBlank() ? ", " + davlat.trim() : "");
            g.namunalar().add(q);
        }
    }

    // ---------------------------------------------------------------- yozdirish

    /** Har 10 daqiqada: yuborilgan to'plamni tekshiradi yoki navbatdagini yuboradi. */
    @Scheduled(initialDelayString = "${malumot.ish-kechikish:300000}", fixedDelayString = "${malumot.ish-oraligi:600000}")
    public void ishla() {
        if (!kalitBormi()) return;
        try {
            List<String> faol = jdbc.queryForList(
                    "SELECT DISTINCT batch_id FROM dori_malumot WHERE holat = 'NAVBATDA' AND batch_id IS NOT NULL", String.class);
            if (!faol.isEmpty()) {
                for (String id : faol) toplamniTekshir(id);
                return;
            }
            String rejim = sozlama("malumot_rejim", "ustuvor");
            if ("toxtatilgan".equals(rejim)) return;
            String shart = "toliq".equals(rejim) ? "" : " AND ustuvor >= 2";
            List<Map<String, Object>> navbat = jdbc.queryForList(
                    "SELECT id, kalit, namunalar FROM dori_malumot WHERE holat = 'KUTMOQDA'" + shart
                            + " AND (tahrirlangan IS NOT TRUE) ORDER BY ustuvor DESC, id LIMIT " + TOPLAM_HAJMI);
            if (navbat.isEmpty()) return;
            yubor(navbat);
        } catch (Exception e) {
            log.warn("Dori ma'lumotlarini yozdirishda xato: {}", e.getMessage());
            sozlamaYoz("malumot_oxirgi_xato", e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    private void yubor(List<Map<String, Object>> navbat) {
        BatchCreateParams.Builder params = BatchCreateParams.builder();
        for (Map<String, Object> q : navbat) {
            params.addRequest(BatchCreateParams.Request.builder()
                    .customId("m" + q.get("id"))
                    .params(BatchCreateParams.Request.Params.builder()
                            .model(MODEL)
                            .maxTokens(8000L)
                            .system(KORSATMA)
                            .outputConfig(OutputConfig.builder()
                                    .effort(OutputConfig.Effort.LOW)
                                    .format(JsonOutputFormat.builder().schema(SXEMA).build())
                                    .build())
                            .addUserMessage(sorov((String) q.get("kalit"), (String) q.get("namunalar")))
                            .build())
                    .build());
        }
        MessageBatch batch = client().messages().batches().create(params.build());
        List<Object[]> yangila = navbat.stream().map(q -> new Object[]{batch.id(), q.get("id")}).toList();
        jdbc.batchUpdate("UPDATE dori_malumot SET holat = 'NAVBATDA', batch_id = ? WHERE id = ?", yangila);
        sozlamaYoz("malumot_oxirgi_xato", "");
        log.info("Dori ma'lumotlari uchun {} ta so'rov yuborildi (batch {}).", navbat.size(), batch.id());
    }

    private static String sorov(String kalit, String namunalar) {
        return "Mahsulot nomi: " + kalit + "\n\nDorixona katalogidagi variantlari (nom — ishlab chiqaruvchi, davlat):\n"
                + (namunalar == null ? "-" : namunalar);
    }

    private void toplamniTekshir(String batchId) {
        MessageBatch batch = client().messages().batches().retrieve(batchId);
        if (!MessageBatch.ProcessingStatus.ENDED.equals(batch.processingStatus())) return;

        long kirish = 0, chiqish = 0;
        int tayyor = 0;
        Set<Long> javobBor = new HashSet<>();
        try (StreamResponse<MessageBatchIndividualResponse> natijalar = client().messages().batches().resultsStreaming(batchId)) {
            for (MessageBatchIndividualResponse javob : (Iterable<MessageBatchIndividualResponse>) natijalar.stream()::iterator) {
                long id = Long.parseLong(javob.customId().substring(1));
                javobBor.add(id);
                if (javob.result().isSucceeded()) {
                    Message m = javob.result().asSucceeded().message();
                    kirish += m.usage().inputTokens();
                    chiqish += m.usage().outputTokens();
                    if (saqla(id, m)) tayyor++;
                } else {
                    String sabab = javob.result().isErrored()
                            ? String.valueOf(javob.result().asErrored().error().error())
                            : javob.result().isExpired() ? "muddati o'tdi" : "bekor qilindi";
                    qaytaNavbat(id, sabab);
                }
            }
        }
        // Javobi kelmagan qatorlar (kamdan-kam) qayta navbatga.
        for (Long id : jdbc.queryForList("SELECT id FROM dori_malumot WHERE batch_id = ? AND holat = 'NAVBATDA'", Long.class, batchId)) {
            if (!javobBor.contains(id)) qaytaNavbat(id, "javob kelmadi");
        }
        double narx = kirish / 1e6 * KIRISH_NARXI + chiqish / 1e6 * CHIQISH_NARXI;
        double jami = Double.parseDouble(sozlama("malumot_sarflangan_usd", "0")) + narx;
        sozlamaYoz("malumot_sarflangan_usd", String.format(java.util.Locale.ROOT, "%.4f", jami));
        log.info("Dori ma'lumotlari: {} ta tayyor, ${} sarflandi (jami ${}).", tayyor,
                String.format(java.util.Locale.ROOT, "%.2f", narx), String.format(java.util.Locale.ROOT, "%.2f", jami));
    }

    /** Javobni tekshirib saqlaydi. true — yo'riqnoma tayyor. */
    private boolean saqla(long id, Message m) {
        if (m.stopReason().map(StopReason.REFUSAL::equals).orElse(false)) {
            jdbc.update("UPDATE dori_malumot SET holat = 'XATO', xato = 'rad etildi', yangilangan = NOW() WHERE id = ?", id);
            return false;
        }
        String matn = m.content().stream().flatMap(b -> b.text().stream()).map(t -> t.text())
                .reduce("", String::concat).trim();
        try {
            JsonNode tugun = json.readTree(matn);
            boolean doriEmas = tugun.path("dori_emas").asBoolean(false);
            jdbc.update("UPDATE dori_malumot SET holat = ?, malumot = ?, xato = NULL, yangilangan = NOW() "
                    + "WHERE id = ? AND tahrirlangan IS NOT TRUE", doriEmas ? "DORI_EMAS" : "TAYYOR", matn, id);
            return !doriEmas;
        } catch (Exception e) {
            qaytaNavbat(id, "JSON o'qilmadi: " + e.getMessage());
            return false;
        }
    }

    private void qaytaNavbat(long id, String sabab) {
        // 3 marta urinib bo'lmasa — XATO (admin ko'radi), cheksiz pul sarflanmasin.
        jdbc.update("UPDATE dori_malumot SET urinish = COALESCE(urinish, 0) + 1, xato = ?, batch_id = NULL, "
                + "holat = CASE WHEN COALESCE(urinish, 0) + 1 >= 3 THEN 'XATO' ELSE 'KUTMOQDA' END, yangilangan = NOW() "
                + "WHERE id = ?", sabab, id);
    }

    // ---------------------------------------------------------------- o'qish

    /** Sayt uchun: dori nomi bo'yicha yo'riqnoma. Ochilgan dori navbatda oldinga suriladi. */
    public Map<String, Object> malumot(String nomi) {
        String kalit = DoriKalit.kalit(nomi);
        List<Map<String, Object>> q = jdbc.queryForList(
                "SELECT id, holat, malumot, ishlab_chiqaruvchi, davlat, ustuvor FROM dori_malumot WHERE kalit = ?", kalit);
        Map<String, Object> natija = new LinkedHashMap<>();
        if (q.isEmpty()) {
            natija.put("holat", "YOQ");
            return natija;
        }
        Map<String, Object> r = q.get(0);
        if ("KUTMOQDA".equals(r.get("holat")) && ((Number) r.get("ustuvor")).intValue() < 2) {
            jdbc.update("UPDATE dori_malumot SET ustuvor = 2 WHERE id = ?", r.get("id"));
        }
        natija.put("holat", r.get("holat"));
        natija.put("ishlabChiqaruvchi", r.get("ishlab_chiqaruvchi"));
        natija.put("davlat", r.get("davlat"));
        if ("TAYYOR".equals(r.get("holat")) && r.get("malumot") != null) {
            try {
                natija.put("malumot", json.readValue((String) r.get("malumot"), Map.class));
            } catch (Exception e) {
                natija.put("holat", "XATO");
            }
        }
        return natija;
    }

    /** Admin paneli uchun umumiy holat. */
    public Map<String, Object> holat() {
        Map<String, Object> h = new LinkedHashMap<>();
        Map<String, Long> soni = new HashMap<>();
        jdbc.query("SELECT holat, COUNT(*) FROM dori_malumot GROUP BY holat", rs -> {
            soni.put(rs.getString(1), rs.getLong(2));
        });
        h.put("soni", soni);
        h.put("ustuvorKutmoqda", jdbc.queryForObject(
                "SELECT COUNT(*) FROM dori_malumot WHERE holat = 'KUTMOQDA' AND ustuvor >= 2", Long.class));
        h.put("rejim", sozlama("malumot_rejim", "ustuvor"));
        h.put("sarflanganUsd", Double.parseDouble(sozlama("malumot_sarflangan_usd", "0")));
        h.put("oxirgiXato", sozlama("malumot_oxirgi_xato", ""));
        h.put("kalitUlangan", kalitBormi());
        h.put("model", MODEL);
        return h;
    }

    public List<Map<String, Object>> qidir(String q, String holat, int limit) {
        StringBuilder sql = new StringBuilder("SELECT id, kalit, holat, ustuvor, ishlab_chiqaruvchi, davlat, tahrirlangan, xato, "
                + "malumot FROM dori_malumot WHERE 1=1");
        List<Object> args = new ArrayList<>();
        if (q != null && !q.isBlank()) {
            sql.append(" AND kalit LIKE ?");
            args.add("%" + q.trim().toUpperCase(java.util.Locale.ROOT) + "%");
        }
        if (holat != null && !holat.isBlank()) {
            sql.append(" AND holat = ?");
            args.add(holat);
        }
        sql.append(" ORDER BY ustuvor DESC, yangilangan DESC NULLS LAST, id LIMIT ").append(Math.min(Math.max(limit, 1), 100));
        return jdbc.queryForList(sql.toString(), args.toArray());
    }

    /** Admin yo'riqnomani qo'lda tuzatadi — endi avtomatik qayta yozilmaydi. */
    public void tahrirla(long id, String malumotJson) throws Exception {
        JsonNode tugun = json.readTree(malumotJson);
        boolean doriEmas = tugun.path("dori_emas").asBoolean(false);
        jdbc.update("UPDATE dori_malumot SET malumot = ?, holat = ?, tahrirlangan = TRUE, xato = NULL, yangilangan = NOW() "
                + "WHERE id = ?", json.writeValueAsString(tugun), doriEmas ? "DORI_EMAS" : "TAYYOR", id);
    }

    /** Qayta yozdirish (masalan, yo'riqnoma noto'g'ri chiqqan bo'lsa). */
    public void qaytaYozdir(long id) {
        jdbc.update("UPDATE dori_malumot SET holat = 'KUTMOQDA', ustuvor = 2, urinish = 0, tahrirlangan = FALSE, "
                + "batch_id = NULL, xato = NULL WHERE id = ? AND holat <> 'NAVBATDA'", id);
    }

    // ---------------------------------------------------------------- ko'rsatma va sxema

    private static final String KORSATMA = """
            Sen O'zbekistondagi "Dori Qidiruv" dorixona sayti uchun dori ma'lumotnomasini yozadigan tajribali klinik farmatsevtsan.
            Senga dorixona katalogidagi bitta mahsulot nomi va uning variantlari (shakli, dozasi, ishlab chiqaruvchisi) beriladi.
            Oddiy xaridor tushunadigan qisqa, aniq yo'riqnoma yoz: ikki tilda — o'zbekcha (lotin yozuvida) va ruscha.

            Qoidalar:
            1. Faqat rasmiy yo'riqnomalarda va farmakologik ma'lumotnomalarda keng tasdiqlangan ma'lumotni yoz. To'qima, taxmin qilma.
            2. Avval mahsulotning ta'sir etuvchi moddasini (xalqaro nomi, MNN) aniqla. Agar bu aniq mahsulot tarkibini ishonchli bilmasang
               (masalan, kam ma'lum mahalliy brend yoki aralash o'simlik vositasi) — ishonch="past" qo'y va matn maydonlarini bo'sh qoldir.
            3. Doza: kattalar uchun odatiy doza va qabul qilish soni; bolalar uchun ruxsat etilgan bo'lsa — yosh bo'yicha qisqacha.
               Variantlarda bir necha shakl/doza bo'lsa, asosiylarini alohida ko'rsat. Kuchli ta'sirli, shifoxonada yoki inyeksiya
               qilinadigan, onkologik, gormonal va psixotrop dorilarda aniq dozani yozma — "Dozani faqat shifokor belgilaydi" de.
            4. qabul_qilish: ovqatdan oldin/keyin/ovqat bilan, suv bilan ichish, kunning qaysi vaqti, davolash davomiyligi haqida.
            5. birga_ichilmaydi: muhim o'zaro ta'sirlar — qaysi dori guruhlari, alkogol, sut, greypfrut va boshqalar.
            6. Har ro'yxat bandi bitta qisqa jumla (taxminan 15 so'zgacha), har ro'yxatda 2–6 band. Tibbiy atamalarni oddiy so'z bilan tushuntir.
            7. Kosmetika, gigiyena vositasi, oziq-ovqat, ichimlik, tibbiy buyum yoki asbob bo'lsa — dori_emas=true, qolgan maydonlar bo'sh.
               Biologik faol qo'shimcha (BFQ/БАД) va vitaminlar dori_emas=false, guruhda "BFQ" deb belgila.
            8. retseptli: O'zbekiston va MDH amaliyotida odatda retsept bilan sotiladigan bo'lsa true.
            9. O'zbekcha matnda sof o'zbek adabiy tilidan foydalan (masalan: "kuniga 2 mahal", "ovqatdan keyin", "homiladorlik").
            """;

    private static Map<String, Object> royxat() {
        return Map.of("type", "array", "items", Map.of("type", "string"));
    }

    private static Map<String, Object> til() {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("guruh", Map.of("type", "string", "description", "Farmakologik guruh, qisqa"));
        p.put("qollanilishi", royxat());
        p.put("qabul_qilish", royxat());
        p.put("doza", royxat());
        p.put("mumkin_emas", royxat());
        p.put("birga_ichilmaydi", royxat());
        p.put("nojoya", royxat());
        p.put("homiladorlik", Map.of("type", "string", "description", "Homiladorlik va emizish davrida qo'llash, 1-2 jumla"));
        p.put("ehtiyot", royxat());
        return Map.of("type", "object", "additionalProperties", false,
                "required", new ArrayList<>(p.keySet()), "properties", p);
    }

    private static final JsonOutputFormat.Schema SXEMA = sxema();

    private static JsonOutputFormat.Schema sxema() {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("dori_emas", Map.of("type", "boolean"));
        p.put("ishonch", Map.of("type", "string", "enum", List.of("yuqori", "orta", "past")));
        p.put("tasir_moddasi", Map.of("type", "string", "description", "Ta'sir etuvchi modda(lar), xalqaro nomi lotincha"));
        p.put("retseptli", Map.of("type", "boolean"));
        p.put("uz", til());
        p.put("ru", til());
        return JsonOutputFormat.Schema.builder()
                .putAdditionalProperty("type", JsonValue.from("object"))
                .putAdditionalProperty("additionalProperties", JsonValue.from(false))
                .putAdditionalProperty("required", JsonValue.from(new ArrayList<>(p.keySet())))
                .putAdditionalProperty("properties", JsonValue.from(p))
                .build();
    }
}
