package com.example.dori_qidiruv_bot.util;

import java.util.Locale;

/**
 * LIKE/ILIKE naqshlari. Foydalanuvchi yozgan "%" va "_" belgilar oddiy harf sifatida qidiriladi
 * (aks holda "%" bitta o'zi butun jadvalni qaytarib, bazani band qilardi).
 */
public final class Naqsh {

    private Naqsh() { }

    private static String ekranla(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    /** "%so'z%" — ichida uchraydi. */
    public static String ichida(String s) {
        return "%" + ekranla(s == null ? "" : s.trim()) + "%";
    }

    /** Kesh kaliti: katta-kichik harf va chetdagi bo'shliqlar farq qilmaydi. */
    public static String kalit(String s) {
        return s == null ? "" : s.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}
