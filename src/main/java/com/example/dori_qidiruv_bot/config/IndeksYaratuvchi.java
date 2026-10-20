package com.example.dori_qidiruv_bot.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Qidiruv va fon ishlari uchun kerakli indekslar. Har ishga tushishda tekshiriladi, yo'q bo'lsa yaratiladi.
 *
 * <p>CONCURRENTLY — indeks qurilayotganda bot va sayt jadvalga yozishda davom etadi (jadval qulflanmaydi).
 * Bunday qurilish uzilib qolsa "yaroqsiz" indeks qoladi — uni o'chirib qayta quramiz.
 * Bu ish data.sql'dan bu yerga ko'chirildi: endi prod'da data.sql'ni o'chirib qo'yish (SQL_INIT_MODE=never) xavfsiz.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class IndeksYaratuvchi {

    private final JdbcTemplate jdbc;

    private static final Map<String, String> INDEKSLAR = new LinkedHashMap<>();

    static {
        // Dorixonalardagi dorilar: nomi bo'yicha qidiruv (ILIKE '%...%'), kategoriya sahifasi, dorixona ro'yxati.
        INDEKSLAR.put("dori_nomi_trgm_idx", "dori USING gin (nomi gin_trgm_ops)");
        INDEKSLAR.put("dori_nomi_ru_trgm_idx", "dori USING gin (nomi_ru gin_trgm_ops)");
        INDEKSLAR.put("dori_kategoriya_trgm_idx", "dori USING gin (kategoriya gin_trgm_ops)");
        INDEKSLAR.put("dori_dorixona_nomi_idx", "dori (dorixona_id, nomi)");
        // Fon ishlari har 2 daqiqada faqat shu qatorlarni qidiradi — butun jadval o'qilmaydi.
        INDEKSLAR.put("dori_kategoriyasiz_idx", "dori (id) WHERE kategoriya IS NULL");
        INDEKSLAR.put("dori_xom_nom_idx", "dori (id) WHERE nomi_ru = upper(nomi_ru)");
        // Katalog: qidiruv (to'rt ustun bo'yicha ILIKE) va autocomplete (boshlanishi bo'yicha, tartiblangan).
        INDEKSLAR.put("dori_katalog_nomi_trgm_idx", "dori_katalog USING gin (nomi gin_trgm_ops)");
        INDEKSLAR.put("dori_katalog_ishlab_trgm_idx", "dori_katalog USING gin (ishlab_chiqaruvchi gin_trgm_ops)");
        INDEKSLAR.put("dori_katalog_nomi_ru_trgm_idx", "dori_katalog USING gin (nomi_ru gin_trgm_ops)");
        INDEKSLAR.put("dori_katalog_nomi_uz_trgm_idx", "dori_katalog USING gin (nomi_uz gin_trgm_ops)");
        INDEKSLAR.put("dori_katalog_nomi_lower_c_idx", "dori_katalog ((lower(nomi) COLLATE \"C\"))");
        // Qoldiq hisobi va bronlar mahsulot bo'yicha.
        INDEKSLAR.put("ombor_harakat_dori_idx", "ombor_harakat (dori_id)");
        INDEKSLAR.put("bron_dori_idx", "bron (dori_id)");
        INDEKSLAR.put("bron_dorixona_idx", "bron (dorixona_id, sana)");
        // Telefon raqami bo'yicha kirish (raqamlardan boshqa belgilar olib tashlanib solishtiriladi).
        INDEKSLAR.put("bot_user_phone_digits_idx", "bot_user (regexp_replace(phone, '[^0-9]', '', 'g'))");
    }

    @Order(0)
    @EventListener(ApplicationReadyEvent.class)
    public void yarat() {
        try {
            jdbc.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm");
        } catch (Exception e) {
            log.warn("pg_trgm kengaytmasini yoqib bo'lmadi — qidiruv indekslarisiz ishlaydi: {}", e.getMessage());
        }
        int yaratildi = 0;
        for (Map.Entry<String, String> ix : INDEKSLAR.entrySet()) {
            try {
                if (yaroqsizmi(ix.getKey())) {
                    jdbc.execute("DROP INDEX CONCURRENTLY IF EXISTS " + ix.getKey());
                }
                if (bormi(ix.getKey())) continue;
                long t = System.currentTimeMillis();
                jdbc.execute("CREATE INDEX CONCURRENTLY IF NOT EXISTS " + ix.getKey() + " ON " + ix.getValue());
                log.info("Indeks yaratildi: {} ({} ms)", ix.getKey(), System.currentTimeMillis() - t);
                yaratildi++;
            } catch (Exception e) {
                log.warn("Indeksni yaratib bo'lmadi ({}): {}", ix.getKey(), e.getMessage());
            }
        }
        if (yaratildi > 0) {
            try {
                jdbc.execute("ANALYZE dori");
                jdbc.execute("ANALYZE dori_katalog");
            } catch (Exception e) {
                log.debug("ANALYZE bajarilmadi: {}", e.getMessage());
            }
        }
    }

    private boolean bormi(String nom) {
        List<Integer> q = jdbc.queryForList("SELECT 1 FROM pg_class WHERE relname = ? AND relkind = 'i'", Integer.class, nom);
        return !q.isEmpty();
    }

    private boolean yaroqsizmi(String nom) {
        List<Boolean> q = jdbc.queryForList(
                "SELECT i.indisvalid FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid WHERE c.relname = ?",
                Boolean.class, nom);
        return !q.isEmpty() && !q.get(0);
    }
}
