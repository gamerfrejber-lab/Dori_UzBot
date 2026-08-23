package com.example.dori_qidiruv_bot.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Neon'dan hozirgi Postgres bazasiga bir marta ma'lumot ko'chirish.
 * Faqat {@code NEON_MIGRATE_SOURCE_URL} environment variable berilganida ishlaydi.
 * Idempotent: qayta ishga tushirilganda ON CONFLICT DO NOTHING orqali dublikatlar yaratmaydi.
 *
 * Ko'chirish tugagach, env o'zgaruvchini olib tashlab, xizmatni qayta ishga tushiring
 * (yoki qoldirsangiz ham xavfsiz — ikkinchi safar hech narsa o'zgartirmaydi).
 *
 * dori_katalog jadvali o'tkazib yuboriladi — u {@link KatalogImporter} orqali qayta yuklanadi.
 */
@Component
@RequiredArgsConstructor
@Order(50) // KatalogImporter'dan (default order) oldin ishlasin
public class NeonMigrator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(NeonMigrator.class);
    private static final Set<String> SKIP_TABLES = Set.of("dori_katalog");

    private final JdbcTemplate jdbcTemplate;

    @Value("${neon.migrate.source-url:}")
    private String sourceUrl;

    @Override
    public void run(String... args) {
        if (sourceUrl == null || sourceUrl.isBlank()) {
            return; // migratsiya so'ralmagan
        }
        log.info("Neon migratsiyasi boshlanmoqda...");
        try (Connection src = DriverManager.getConnection(sourceUrl)) {
            src.setAutoCommit(false);
            List<String> tables = listTables(src);
            log.info("Manba jadvallari: {}", tables);

            // 1) Yetishmayotgan jadval/ustunlarni Render bazasida yaratamiz
            for (String t : tables) {
                if (SKIP_TABLES.contains(t)) continue;
                ensureTable(src, t);
            }

            // 2) Ma'lumotni ko'chiramiz (faqat mos keladigan ustunlar)
            for (String t : tables) {
                if (SKIP_TABLES.contains(t)) continue;
                int n = copyData(src, t);
                log.info("[data] {} → {} qator", t, n);
            }

            // 3) Sequencelarni max(id)+1 ga sinxronlash
            syncSequences(src);

            log.info("Neon migratsiyasi TUGADI.");
        } catch (Exception e) {
            log.error("Neon migratsiyasi xatosi: {}", e.getMessage(), e);
        }
    }

    private List<String> listTables(Connection src) throws SQLException {
        List<String> out = new ArrayList<>();
        try (PreparedStatement ps = src.prepareStatement(
                "SELECT table_name FROM information_schema.tables " +
                        "WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) out.add(rs.getString(1));
        }
        return out;
    }

    /** Jadvalni Render'da yaratadi (yo'q bo'lsa) va yetishmagan ustunlarni qo'shadi. */
    private void ensureTable(Connection src, String table) throws SQLException {
        // Manba ustunlari (nomi, turi, uzunlik, null bo'lishi, default)
        List<Column> srcCols = new ArrayList<>();
        try (PreparedStatement ps = src.prepareStatement(
                "SELECT column_name, data_type, character_maximum_length, is_nullable, column_default " +
                        "FROM information_schema.columns WHERE table_schema='public' AND table_name=? ORDER BY ordinal_position")) {
            ps.setString(1, table);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) srcCols.add(new Column(
                        rs.getString(1), rs.getString(2),
                        (Integer) rs.getObject(3), rs.getString(4), rs.getString(5)));
            }
        }

        // Jadval Render'da bormi?
        boolean exists = tableExists(table);
        if (!exists) {
            // Sequencelarni oldindan yaratamiz (default nextval() ishlashi uchun)
            for (Column c : srcCols) {
                if (c.def != null && c.def.startsWith("nextval(")) {
                    String seq = table + "_" + c.name + "_seq";
                    execSilent("CREATE SEQUENCE IF NOT EXISTS \"" + seq + "\"");
                }
            }
            // CREATE TABLE
            StringBuilder sb = new StringBuilder("CREATE TABLE \"").append(table).append("\" (\n");
            List<String> lines = new ArrayList<>();
            for (Column c : srcCols) lines.add("  " + c.toDdl(table));
            sb.append(String.join(",\n", lines)).append("\n)");
            execSilent(sb.toString());
            log.info("[schema] jadval yaratildi: {}", table);

            // Primary key
            List<String> pk = pkColumns(src, table);
            if (!pk.isEmpty()) {
                String pkSql = "ALTER TABLE \"" + table + "\" ADD PRIMARY KEY (" +
                        String.join(",", pk.stream().map(x -> "\"" + x + "\"").toArray(String[]::new)) + ")";
                execSilent(pkSql);
            }
        } else {
            // Yetishmagan ustunlarni qo'shamiz
            Set<String> existing = existingColumns(table);
            for (Column c : srcCols) {
                if (!existing.contains(c.name.toLowerCase())) {
                    String alter = "ALTER TABLE \"" + table + "\" ADD COLUMN IF NOT EXISTS " + c.toDdl(table);
                    execSilent(alter);
                    log.info("[schema] ustun qo'shildi: {}.{}", table, c.name);
                }
            }
        }
    }

    private boolean tableExists(String table) {
        Integer n = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name=?",
                Integer.class, table);
        return n != null && n > 0;
    }

    private Set<String> existingColumns(String table) {
        List<String> cols = jdbcTemplate.queryForList(
                "SELECT LOWER(column_name) FROM information_schema.columns WHERE table_schema='public' AND table_name=?",
                String.class, table);
        return new HashSet<>(cols);
    }

    private List<String> pkColumns(Connection src, String table) throws SQLException {
        List<String> out = new ArrayList<>();
        try (PreparedStatement ps = src.prepareStatement(
                "SELECT kcu.column_name FROM information_schema.table_constraints tc " +
                        "JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name " +
                        "WHERE tc.table_schema='public' AND tc.table_name=? AND tc.constraint_type='PRIMARY KEY' " +
                        "ORDER BY kcu.ordinal_position")) {
            ps.setString(1, table);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) out.add(rs.getString(1));
            }
        }
        return out;
    }

    /** Faqat manba va nishonda mavjud bo'lgan ustunlarni ko'chiradi. */
    private int copyData(Connection src, String table) throws SQLException {
        Set<String> tgtCols = existingColumns(table);
        List<String> srcOrder = new ArrayList<>();
        try (PreparedStatement ps = src.prepareStatement(
                "SELECT column_name FROM information_schema.columns " +
                        "WHERE table_schema='public' AND table_name=? ORDER BY ordinal_position")) {
            ps.setString(1, table);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) srcOrder.add(rs.getString(1));
            }
        }
        // Manba ustunlari orasidan Render'da ham borlarini olamiz
        List<String> useCols = new ArrayList<>();
        for (String c : srcOrder) if (tgtCols.contains(c.toLowerCase())) useCols.add(c);
        if (useCols.isEmpty()) {
            log.warn("[data] {}: umumiy ustun yo'q, o'tkazildi", table);
            return 0;
        }

        List<String> pk = pkColumns(src, table);
        String colList = quoted(useCols);
        String placeholders = String.join(",", java.util.Collections.nCopies(useCols.size(), "?"));
        String conflict = "";
        if (!pk.isEmpty()) {
            List<String> pkInUse = new ArrayList<>();
            for (String p : pk) if (tgtCols.contains(p.toLowerCase()) && useCols.contains(p)) pkInUse.add(p);
            if (!pkInUse.isEmpty()) conflict = " ON CONFLICT (" + quoted(pkInUse) + ") DO NOTHING";
        }
        String insertSql = "INSERT INTO \"" + table + "\" (" + colList + ") VALUES (" + placeholders + ")" + conflict;

        int total = 0;
        try (PreparedStatement srcPs = src.prepareStatement("SELECT " + colList + " FROM \"" + table + "\"");
             ResultSet rs = srcPs.executeQuery()) {
            srcPs.setFetchSize(200);
            List<Object[]> batch = new ArrayList<>();
            while (rs.next()) {
                Object[] row = new Object[useCols.size()];
                for (int i = 0; i < useCols.size(); i++) row[i] = rs.getObject(i + 1);
                batch.add(row);
                total++;
                if (batch.size() >= 200) {
                    jdbcTemplate.batchUpdate(insertSql, batch);
                    batch.clear();
                }
            }
            if (!batch.isEmpty()) jdbcTemplate.batchUpdate(insertSql, batch);
        }
        return total;
    }

    private void syncSequences(Connection src) throws SQLException {
        Set<String> tables = new LinkedHashSet<>(listTables(src));
        for (String t : tables) {
            if (SKIP_TABLES.contains(t)) continue;
            if (!tableExists(t)) continue;
            if (!existingColumns(t).contains("id")) continue;
            String seq = t + "_id_seq";
            try {
                jdbcTemplate.execute("SELECT setval('" + seq + "', COALESCE((SELECT MAX(id) FROM \"" + t + "\"), 1), true)");
                log.info("[seq] {} sinxronlandi", seq);
            } catch (Exception ignored) { /* sequence yo'q bo'lsa e'tibor bermaymiz */ }
        }
    }

    private void execSilent(String sql) {
        try { jdbcTemplate.execute(sql); }
        catch (Exception e) {
            String msg = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
            if (!msg.contains("already exists")) {
                log.warn("SQL xatosi: {} — {}", e.getMessage(), sql.length() > 120 ? sql.substring(0, 120) + "..." : sql);
            }
        }
    }

    private static String quoted(List<String> cols) {
        return String.join(",", cols.stream().map(x -> "\"" + x + "\"").toArray(String[]::new));
    }

    private record Column(String name, String type, Integer maxLen, String nullable, String def) {
        String toDdl(String table) {
            StringBuilder sb = new StringBuilder("\"" + name + "\" " + mapType(type, maxLen));
            if (def != null) {
                if (def.startsWith("nextval(")) {
                    sb.append(" DEFAULT nextval('").append(table).append("_").append(name).append("_seq')");
                } else {
                    sb.append(" DEFAULT ").append(def);
                }
            }
            if ("NO".equals(nullable)) sb.append(" NOT NULL");
            return sb.toString();
        }

        static String mapType(String t, Integer max) {
            switch (t) {
                case "character varying": return max != null ? "varchar(" + max + ")" : "varchar";
                case "character": return max != null ? "char(" + max + ")" : "char";
                case "timestamp without time zone": return "timestamp";
                case "timestamp with time zone": return "timestamptz";
                default: return t;
            }
        }
    }
}
