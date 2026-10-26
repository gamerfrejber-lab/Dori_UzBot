package com.example.dori_qidiruv_bot.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/** Dori nomiga qarab kategoriyani aniqlaydi. Qoidalar kategoriya_qoidalar.tsv faylida. */
@Component
public class KategoriyaAniqlovchi {

    public static final String BOSHQA = "boshqa";
    /** Qo'shimcha belgi: retsept bilan beriladigan dori (qoidalar RetseptAniqlovchi'da). */
    public static final String RETSEPTLI = "retseptli";
    /** Bu asosiy kategoriyalar dori emas — retseptli bo'la olmaydi. */
    private static final Set<String> BUYUMLAR = Set.of("tibbiy-buyumlar", "gigiyena");

    private record Qoida(String slug, boolean qoshimcha, Pattern kalit) { }

    private final List<Qoida> qoidalar = yukla();
    private final RetseptAniqlovchi retsept;

    public KategoriyaAniqlovchi(RetseptAniqlovchi retsept) {
        this.retsept = retsept;
    }

    private static List<Qoida> yukla() {
        List<Qoida> natija = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("kategoriya_qoidalar.tsv").getInputStream(), StandardCharsets.UTF_8))) {
            String qator;
            while ((qator = reader.readLine()) != null) {
                if (qator.isBlank() || qator.startsWith("#")) continue;
                String[] qism = qator.split("\t", 2);
                if (qism.length != 2) continue;
                boolean qoshimcha = qism[0].startsWith("+");
                Pattern kalit = naqsh(List.of(qism[1]));
                if (kalit == null) continue;
                natija.add(new Qoida(qoshimcha ? qism[0].substring(1) : qism[0], qoshimcha, kalit));
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Kategoriya qoidalarini o'qib bo'lmadi", e);
        }
        return natija;
    }

    /**
     * "|" bilan ajratilgan kalit so'zlar qatorlari uchun naqsh; kalit yo'q bo'lsa null.
     * Kalit so'z faqat so'z boshida mos keladi: "ЦЕФ-ОД" → "ИЗОЦЕФ-ОД" ga tushmaydi.
     */
    static Pattern naqsh(List<String> qatorlar) {
        if (qatorlar == null) return null;
        String kalitlar = qatorlar.stream()
                .flatMap(q -> Arrays.stream(q.split("\\|")))
                .filter(k -> !k.isEmpty())
                .map(Pattern::quote)
                .collect(Collectors.joining("|"));
        return kalitlar.isEmpty() ? null : Pattern.compile("(?<![0-9A-ZА-ЯЁ])(?:" + kalitlar + ")");
    }

    /** Natija bazada saqlanadigan ko'rinishda: ",asosiy,qoshimcha,". Retseptli dori ",retseptli," belgisini ham oladi. */
    public String aniqla(String nomi, String nomiRu) {
        String matn = ((nomiRu == null ? "" : nomiRu) + " " + (nomi == null ? "" : nomi)).toUpperCase(Locale.ROOT);
        String asosiy = null;
        Set<String> belgilar = new LinkedHashSet<>();
        for (Qoida qoida : qoidalar) {
            if (qoida.qoshimcha()) {
                if (qoida.kalit().matcher(matn).find()) belgilar.add(qoida.slug());
            } else if (asosiy == null && qoida.kalit().matcher(matn).find()) {
                asosiy = qoida.slug();
            }
        }
        if (asosiy == null && belgilar.isEmpty()) asosiy = BOSHQA;
        Set<String> hammasi = new LinkedHashSet<>();
        if (asosiy != null) hammasi.add(asosiy);
        hammasi.addAll(belgilar);
        // Set.of(...).contains(null) xato beradi — asosiy faqat "+bolalar" mos kelganda null bo'ladi.
        boolean buyum = asosiy != null && BUYUMLAR.contains(asosiy);
        if (!buyum && retsept.retseptlimi(matn)) hammasi.add(RETSEPTLI);
        return "," + String.join(",", hammasi) + ",";
    }

    /** Dori retsept bilan beriladimi — bazadagi belgini kutmasdan nomning o'zidan (yangi qo'shilgan dori uchun ham). */
    public boolean retseptlimi(String nomi, String nomiRu) {
        return aniqla(nomi, nomiRu).contains("," + RETSEPTLI + ",");
    }
}
