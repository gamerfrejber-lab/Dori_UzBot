package com.example.dori_qidiruv_bot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Dorixona yuklagan xom nomlarni ("КОНКОР ТАБ 5МГ №30") tayyor ko'rinishga keltiradi:
 * o'zbekcha va ruscha to'liq nom beradi hamda bir dorixonadagi takror qatorlarni olib tashlaydi.
 * Dorixonalar faylni tizimidan qanday chiqqan bo'lsa shunday yuboradi, shuning uchun bu ish
 * import paytida emas, shu yerda bajariladi.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NomTozalovchi {

    private static final int NOM_UZUNLIGI = 255;

    private final JdbcTemplate jdbc;

    /** Qo'lda tekshirilgan tarjimalar: xom nom -> {o'zbekcha, ruscha}. */
    private final Map<String, String[]> tayyorNomlar = yukla();

    private record Qator(long id, String nomi, String xom, String kalit, String lotinKalit, String firma, double narx, long dorixonaId) { }

    private static Map<String, String[]> yukla() {
        Map<String, String[]> natija = new HashMap<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("dori_nomlar.tsv").getInputStream(), StandardCharsets.UTF_8))) {
            String qator;
            while ((qator = reader.readLine()) != null) {
                if (qator.isBlank() || qator.startsWith("#")) continue;
                String[] c = qator.split("\t");
                if (c.length == 3) natija.put(kalit(c[0]), new String[]{c[1], c[2]});
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Dori nomlari lug'atini o'qib bo'lmadi", e);
        }
        return natija;
    }

    private static String kalit(String nom) {
        return nom.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
    }

    public void tozala() {
        try {
            // Xom nomda kichik harf bo'lmaydi; tozalangan qator bu shartga qayta tushmaydi.
            List<Qator> xomlar = new ArrayList<>();
            for (Map<String, Object> q : jdbc.queryForList(
                    "SELECT id, nomi, nomi_ru, ishlab_chiqaruvchi, narx, dorixona_id FROM dori "
                            + "WHERE nomi_ru IS NOT NULL AND nomi_ru <> '' AND nomi_ru = upper(nomi_ru) AND dorixona_id IS NOT NULL")) {
                String xom = ((String) q.get("nomi_ru")).trim();
                // upper() baza lokaliga bog'liq (kirillni o'zgartirmasligi mumkin) — shu yerda qayta tekshiramiz.
                if (xom.chars().noneMatch(Character::isLetter) || xom.chars().anyMatch(Character::isLowerCase)) continue;
                String firma = q.get("ishlab_chiqaruvchi") == null ? "" : kalit((String) q.get("ishlab_chiqaruvchi"));
                double narx = q.get("narx") == null ? 0 : ((Number) q.get("narx")).doubleValue();
                String nomi = q.get("nomi") == null ? "" : (String) q.get("nomi");
                xomlar.add(new Qator(((Number) q.get("id")).longValue(), nomi, xom, kalit(xom), kalit(nomi), firma, narx,
                        ((Number) q.get("dorixona_id")).longValue()));
            }
            if (xomlar.isEmpty()) return;

            int tozalandi = nomlarniYangila(xomlar);
            int ochirildi = takrorlarniOchir(xomlar);
            if (tozalandi > 0 || ochirildi > 0) {
                log.info("Dori nomlari tozalandi: {} ta yangilandi, {} ta takror qator o'chirildi.", tozalandi, ochirildi);
            }
        } catch (Exception e) {
            log.warn("Dori nomlarini tozalab bo'lmadi: {}", e.getMessage());
        }
    }

    private int nomlarniYangila(List<Qator> xomlar) {
        Map<String, String[]> katalogdan = katalogdanTop(xomlar);
        List<Object[]> yangilanadi = new ArrayList<>();
        for (Qator q : xomlar) {
            String[] nom = tayyorNomlar.get(q.kalit());
            // Fayldagi nom lotincha bo'lsa bot nomi_ru ga o'zi yasagan kirillchani yozadi — asl nom "nomi" da qoladi.
            if (nom == null) nom = tayyorNomlar.get(q.lotinKalit());
            if (nom == null) nom = katalogdan.get(q.xom());
            if (nom == null) continue;
            // Tayyor ruscha nomi ham katta harflarda bo'lgan mahsulot har safar qayta yozilmasin.
            if (qisqart(nom[0]).equals(q.nomi()) && qisqart(nom[1]).equals(q.xom())) continue;
            // kategoriya NULL — nom o'zgargach KategoriyaBelgilovchi qayta hisoblaydi.
            yangilanadi.add(new Object[]{qisqart(nom[0]), qisqart(nom[1]), q.id()});
        }
        if (!yangilanadi.isEmpty()) {
            jdbc.batchUpdate("UPDATE dori SET nomi = ?, nomi_ru = ?, kategoriya = NULL WHERE id = ?", yangilanadi);
        }
        return yangilanadi.size();
    }

    /** Lug'atda yo'q nomlar uchun umumiy katalogdagi tarjima (xom nom aynan mos kelsa). */
    private Map<String, String[]> katalogdanTop(List<Qator> xomlar) {
        List<String> izlanadi = xomlar.stream()
                .filter(q -> !tayyorNomlar.containsKey(q.kalit()))
                .map(Qator::xom).distinct().toList();
        Map<String, String[]> natija = new HashMap<>();
        for (int i = 0; i < izlanadi.size(); i += 500) {
            List<String> qism = izlanadi.subList(i, Math.min(i + 500, izlanadi.size()));
            String savollar = String.join(",", Collections.nCopies(qism.size(), "?"));
            jdbc.query("SELECT nomi, nomi_uz, nomi_ru FROM dori_katalog WHERE nomi IN (" + savollar + ") "
                            + "AND nomi_uz IS NOT NULL AND nomi_ru IS NOT NULL",
                    rs -> { natija.putIfAbsent(rs.getString(1), new String[]{rs.getString(2), rs.getString(3)}); },
                    qism.toArray());
        }
        return natija;
    }

    /**
     * Bir dorixonada bir xil nom va ishlab chiqaruvchi bilan kelgan qatorlardan bittasi qoladi —
     * eng yuqori narxlisi. Bron yoki ombor yozuvi bog'langan qatorlarga tegilmaydi.
     */
    private int takrorlarniOchir(List<Qator> xomlar) {
        Map<String, Qator> qoladi = new LinkedHashMap<>();
        List<Object[]> ortiqcha = new ArrayList<>();
        for (Qator q : xomlar) {
            String guruh = q.dorixonaId() + "|" + q.kalit() + "|" + q.firma();
            Qator hozirgi = qoladi.get(guruh);
            if (hozirgi == null) {
                qoladi.put(guruh, q);
            } else if (q.narx() > hozirgi.narx()) {
                ortiqcha.add(new Object[]{hozirgi.id()});
                qoladi.put(guruh, q);
            } else {
                ortiqcha.add(new Object[]{q.id()});
            }
        }
        if (ortiqcha.isEmpty()) return 0;
        try {
            int jami = 0;
            for (int n : jdbc.batchUpdate("DELETE FROM dori d WHERE d.id = ? "
                    + "AND NOT EXISTS (SELECT 1 FROM bron b WHERE b.dori_id = d.id) "
                    + "AND NOT EXISTS (SELECT 1 FROM ombor_harakat o WHERE o.dori_id = d.id)", ortiqcha)) {
                if (n > 0) jami += n;
            }
            return jami;
        } catch (Exception e) {
            log.warn("Takror dorilarni o'chirib bo'lmadi: {}", e.getMessage());
            return 0;
        }
    }

    private static String qisqart(String nom) {
        return nom.length() <= NOM_UZUNLIGI ? nom : nom.substring(0, NOM_UZUNLIGI);
    }
}
