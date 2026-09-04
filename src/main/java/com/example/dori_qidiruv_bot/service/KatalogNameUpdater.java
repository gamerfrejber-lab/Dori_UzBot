package com.example.dori_qidiruv_bot.service;

import lombok.RequiredArgsConstructor;
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

/** Additive, repeatable update: preserves original names, IDs and stock. */
@Component
@Order(110)
@RequiredArgsConstructor
public class KatalogNameUpdater implements CommandLineRunner {
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void run(String... args) throws Exception {
        List<Object[]> batch = new ArrayList<>();
        try (var reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("dori_katalog_localized.tsv").getInputStream(), StandardCharsets.UTF_8))) {
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
    }

    private void update(List<Object[]> batch) {
        jdbcTemplate.batchUpdate("UPDATE dori_katalog SET nomi_ru = ?, nomi_uz = ? "
                + "WHERE nomi = ? AND COALESCE(ishlab_chiqaruvchi, '') = ? AND COALESCE(davlat, '') = ? "
                + "AND (nomi_ru IS DISTINCT FROM ? OR nomi_uz IS DISTINCT FROM ?)", batch);
    }
}
