package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.repository.DoriKatalogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Dori katalogini (butun O'zbekiston, ~26 ming nom) bir marta bazaga yuklaydi.
 * Ma'lumot {@code src/main/resources/dori_katalog.tsv} faylida (tab bilan ajratilgan:
 * nomi &lt;TAB&gt; ishlab_chiqaruvchi &lt;TAB&gt; davlat).
 *
 * Jadval bo'sh bo'lsagina yuklaydi — shuning uchun qayta ishga tushirilganda
 * takror yuklanmaydi. Katalogni yangilash uchun jadvalni tozalab qayta ishga tushirish kifoya.
 */
@Component
@RequiredArgsConstructor
public class KatalogImporter implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(KatalogImporter.class);
    private static final String RESURS = "dori_katalog.tsv";
    private static final int BATCH = 1000;

    private final DoriKatalogRepository katalogRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        long mavjud = katalogRepository.count();
        if (mavjud > 0) {
            log.info("Dori katalogi allaqachon yuklangan ({} ta) — import o'tkazib yuborildi.", mavjud);
            return;
        }

        ClassPathResource resurs = new ClassPathResource(RESURS);
        if (!resurs.exists()) {
            log.warn("Katalog fayli topilmadi: {} — import bajarilmadi.", RESURS);
            return;
        }

        String sql = "INSERT INTO dori_katalog (nomi, ishlab_chiqaruvchi, davlat) VALUES (?, ?, ?)";
        List<Object[]> partiya = new ArrayList<>(BATCH);
        long jami = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resurs.getInputStream(), StandardCharsets.UTF_8))) {
            String qator;
            while ((qator = reader.readLine()) != null) {
                if (qator.isBlank()) continue;
                // -1 limit: oxiridagi bo'sh ustunlar ham saqlansin
                String[] ustunlar = qator.split("\t", -1);
                String nomi = ustunlar.length > 0 ? bosh(ustunlar[0]) : null;
                if (nomi == null) continue;
                String ishlab = ustunlar.length > 1 ? bosh(ustunlar[1]) : null;
                String davlat = ustunlar.length > 2 ? bosh(ustunlar[2]) : null;

                partiya.add(new Object[] { nomi, ishlab, davlat });
                if (partiya.size() >= BATCH) {
                    jdbcTemplate.batchUpdate(sql, partiya);
                    jami += partiya.size();
                    partiya.clear();
                }
            }
            if (!partiya.isEmpty()) {
                jdbcTemplate.batchUpdate(sql, partiya);
                jami += partiya.size();
            }
            log.info("Dori katalogi yuklandi: {} ta mahsulot.", jami);
        } catch (Exception e) {
            log.error("Dori katalogini yuklashda xatolik: {}", e.getMessage(), e);
        }
    }

    /** Bo'sh matnni null ga aylantiradi, chetlaridagi bo'shliqlarni oladi. */
    private static String bosh(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
