package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.util.ResursCrc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Katalogga tayyor ruscha/o'zbekcha nomlarni yozadi (asl nom, id va qoldiqqa tegmaydi).
 * Fayl (5 MB) faqat o'zgargan bo'lsa o'qiladi: avval har ishga tushishda 26 ming UPDATE bajarilardi.
 */
@Slf4j
@Component
@Order(110)
@RequiredArgsConstructor
public class KatalogNameUpdater implements CommandLineRunner {
    private static final String FAYL = "dori_katalog_localized.tsv";

    private final JdbcTemplate jdbcTemplate;
    private final SaytSozlama sozlama;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void run(String... args) throws Exception {
        String crc = ResursCrc.hisobla(FAYL);
        if (crc != null && crc.equals(sozlama.ol("katalog_nomlar_crc", null))) {
            log.info("Katalog nomlari o'zgarmagan — yangilash o'tkazib yuborildi.");
            return;
        }
        List<Object[]> batch = new ArrayList<>();
        try (var reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource(FAYL).getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String[] c = line.split("\t", -1);
                if (c.length != 5 || c[3].isBlank() || c[4].isBlank()) {
                    throw new IllegalStateException("Invalid localized catalog row");
                }
                batch.add(new Object[]{c[3], c[4], c[0], c[1], c[2], c[3], c[4]});
                if (batch.size() == 1000) { update(batch); batch.clear(); }
            }
        }
        if (!batch.isEmpty()) update(batch);
        if (crc != null) sozlama.yoz("katalog_nomlar_crc", crc);
    }

    private void update(List<Object[]> batch) {
        jdbcTemplate.batchUpdate("UPDATE dori_katalog SET nomi_ru = ?, nomi_uz = ? "
                + "WHERE nomi = ? AND COALESCE(ishlab_chiqaruvchi, '') = ? AND COALESCE(davlat, '') = ? "
                + "AND (nomi_ru IS DISTINCT FROM ? OR nomi_uz IS DISTINCT FROM ?)", batch);
    }
}
