package com.example.dori_qidiruv_bot.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/** Saytning kichik sozlamalari va belgilari (kalit → qiymat), "sayt_sozlama" jadvalida. */
@Service
@RequiredArgsConstructor
public class SaytSozlama {

    private final JdbcTemplate jdbc;
    private volatile boolean jadvalBor;

    private void jadval() {
        if (jadvalBor) return;
        jdbc.execute("CREATE TABLE IF NOT EXISTS sayt_sozlama (kalit VARCHAR(100) PRIMARY KEY, qiymat TEXT)");
        jadvalBor = true;
    }

    public String ol(String kalit, String standart) {
        jadval();
        List<String> q = jdbc.queryForList("SELECT qiymat FROM sayt_sozlama WHERE kalit = ?", String.class, kalit);
        return q.isEmpty() || q.get(0) == null ? standart : q.get(0);
    }

    public void yoz(String kalit, String qiymat) {
        jadval();
        jdbc.update("INSERT INTO sayt_sozlama (kalit, qiymat) VALUES (?, ?) "
                + "ON CONFLICT (kalit) DO UPDATE SET qiymat = EXCLUDED.qiymat", kalit, qiymat);
    }
}
