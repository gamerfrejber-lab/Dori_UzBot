package com.example.dori_qidiruv_bot.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Dori nomiga qarab u retsept bilan beriladimi — shuni aniqlaydi. Qoidalar retsept_qoidalar.tsv faylida.
 * Retseptli dorilarni bron qilish mumkin, lekin yetkazib bo'lmaydi: dorixona ularni faqat shifokor
 * imzosi va muhri bor retseptni ko'rib beradi.
 */
@Component
public class RetseptAniqlovchi {

    public static final String QOIDALAR_FAYLI = "retsept_qoidalar.tsv";

    private final Pattern istisno;
    private final Pattern qatiy;
    private final Pattern ichki;
    private final Pattern tashqi;

    public RetseptAniqlovchi() {
        Map<String, List<String>> kalitlar = yukla();
        istisno = KategoriyaAniqlovchi.naqsh(kalitlar.get("istisno"));
        qatiy = KategoriyaAniqlovchi.naqsh(kalitlar.get("qatiy"));
        ichki = KategoriyaAniqlovchi.naqsh(kalitlar.get("ichki"));
        tashqi = KategoriyaAniqlovchi.naqsh(kalitlar.get("tashqi"));
    }

    private static Map<String, List<String>> yukla() {
        Map<String, List<String>> natija = new HashMap<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource(QOIDALAR_FAYLI).getInputStream(), StandardCharsets.UTF_8))) {
            String qator;
            while ((qator = reader.readLine()) != null) {
                if (qator.isBlank() || qator.startsWith("#")) continue;
                String[] qism = qator.split("\t", 2);
                if (qism.length != 2) continue;
                natija.computeIfAbsent(qism[0].trim(), k -> new ArrayList<>()).add(qism[1]);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Retsept qoidalarini o'qib bo'lmadi", e);
        }
        return natija;
    }

    /** matn — dori nomi katta harflarda (KategoriyaAniqlovchi bilan bir xil: ruscha + lotincha nom). */
    public boolean retseptlimi(String matn) {
        if (matn == null || matn.isBlank()) return false;
        if (istisno != null && istisno.matcher(matn).find()) return false;
        if (qatiy != null && qatiy.matcher(matn).find()) return true;
        return ichki != null && ichki.matcher(matn).find()
                && (tashqi == null || !tashqi.matcher(matn).find());
    }
}
