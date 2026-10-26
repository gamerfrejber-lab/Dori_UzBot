package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.util.ResursCrc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Dorilarga kategoriya yozadi. Dorilar bazaga bot orqali ham tushadi, shuning uchun
 * import paytida emas, shu yerda — sayt tomonida belgilanadi.
 *
 * <p>Jadval 5 000 qatorlik bo'laklarda o'qiladi: avval butun "dori" jadvali bitta ro'yxatga yuklanardi va
 * 1 mln qatorda 320 MB xotira yetmay sayt ishga tushmay qolardi.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KategoriyaBelgilovchi {

    private static final int BOLAK = 5000;
    private static final String QOIDALAR_FAYLI = "kategoriya_qoidalar.tsv";

    private final JdbcTemplate jdbc;
    private final KategoriyaAniqlovchi aniqlovchi;
    private final NomTozalovchi nomTozalovchi;
    private final SaytSozlama sozlama;

    /**
     * Ishga tushganda: qoidalar fayli o'zgargan bo'lsagina hamma dorilar qayta hisoblanadi
     * (avval har restartda 1 mln qator qayta hisoblanib, ~1,5 daqiqa protsessorni band qilardi).
     */
    @Order(10)
    @EventListener(ApplicationReadyEvent.class)
    public void hammasiniQaytaBelgila() {
        nomTozalovchi.tozala();
        // Retsept qoidalari ham kategoriya ustuniga yoziladi (",retseptli,"), shuning uchun ikkala fayl kuzatiladi.
        String kategoriyaCrc = ResursCrc.hisobla(QOIDALAR_FAYLI);
        String retseptCrc = ResursCrc.hisobla(RetseptAniqlovchi.QOIDALAR_FAYLI);
        String crc = kategoriyaCrc == null || retseptCrc == null ? null : kategoriyaCrc + "/" + retseptCrc;
        if (crc != null && crc.equals(sozlama.ol("kategoriya_qoidalar_crc", null))) {
            int jami = bolaklab(true);
            if (jami > 0) log.info("{} ta yangi doriga kategoriya belgilandi.", jami);
            return;
        }
        int jami = bolaklab(false);
        if (crc != null) sozlama.yoz("kategoriya_qoidalar_crc", crc);
        log.info("Kategoriya qoidalari o'zgargan — {} ta dorining kategoriyasi yangilandi.", jami);
    }

    /** Yangi qo'shilgan (hali belgilanmagan) dorilar: avval nomi tozalanadi, keyin kategoriya belgilanadi. */
    @Scheduled(initialDelay = 120_000, fixedDelay = 120_000)
    public void yangilarniBelgila() {
        nomTozalovchi.tozala();
        int jami = bolaklab(true);
        if (jami > 0) log.info("{} ta yangi doriga kategoriya belgilandi.", jami);
    }

    /** Jadvalni id bo'yicha bo'laklab o'qiydi; faqatNull — faqat kategoriyasi yo'qlar (qisman indeks bilan). */
    private int bolaklab(boolean faqatNull) {
        int jami = 0;
        long oxirgiId = 0;
        try {
            while (true) {
                List<Map<String, Object>> bolak = jdbc.queryForList(
                        "SELECT id, nomi, nomi_ru, kategoriya FROM dori WHERE id > ?"
                                + (faqatNull ? " AND kategoriya IS NULL" : "") + " ORDER BY id LIMIT " + BOLAK, oxirgiId);
                if (bolak.isEmpty()) break;
                List<Object[]> yangilanadi = new ArrayList<>();
                for (Map<String, Object> qator : bolak) {
                    String yangi = aniqlovchi.aniqla((String) qator.get("nomi"), (String) qator.get("nomi_ru"));
                    if (!yangi.equals(qator.get("kategoriya"))) {
                        yangilanadi.add(new Object[]{yangi, qator.get("id")});
                    }
                }
                if (!yangilanadi.isEmpty()) {
                    jdbc.batchUpdate("UPDATE dori SET kategoriya = ? WHERE id = ?", yangilanadi);
                    jami += yangilanadi.size();
                }
                oxirgiId = ((Number) bolak.get(bolak.size() - 1).get("id")).longValue();
                if (bolak.size() < BOLAK) break;
            }
        } catch (Exception e) {
            log.warn("Kategoriyalarni belgilab bo'lmadi: {}", e.getMessage());
        }
        return jami;
    }
}
