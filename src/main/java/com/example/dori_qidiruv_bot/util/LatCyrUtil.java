package com.example.dori_qidiruv_bot.util;

import java.util.HashMap;
import java.util.Map;

public final class LatCyrUtil {
    private LatCyrUtil() {}

    private static final String[][] LAT_MULTI = {
            {"shch", "щ"}, {"sh", "ш"}, {"ch", "ч"}, {"ts", "ц"},
            {"ya", "я"}, {"yu", "ю"}, {"yo", "ё"}, {"zh", "ж"}, {"kh", "х"},
    };

    private static final Map<Character, String> LAT_SINGLE = new HashMap<>();
    static {
        LAT_SINGLE.put('a', "а"); LAT_SINGLE.put('b', "б");
        LAT_SINGLE.put('c', "ц"); LAT_SINGLE.put('d', "д");
        LAT_SINGLE.put('e', "е"); LAT_SINGLE.put('f', "ф");
        LAT_SINGLE.put('g', "г"); LAT_SINGLE.put('h', "х");
        LAT_SINGLE.put('i', "и"); LAT_SINGLE.put('j', "ж");
        LAT_SINGLE.put('k', "к"); LAT_SINGLE.put('l', "л");
        LAT_SINGLE.put('m', "м"); LAT_SINGLE.put('n', "н");
        LAT_SINGLE.put('o', "о"); LAT_SINGLE.put('p', "п");
        LAT_SINGLE.put('q', "к"); LAT_SINGLE.put('r', "р");
        LAT_SINGLE.put('s', "с"); LAT_SINGLE.put('t', "т");
        LAT_SINGLE.put('u', "у"); LAT_SINGLE.put('v', "в");
        LAT_SINGLE.put('w', "в"); LAT_SINGLE.put('x', "кс");
        LAT_SINGLE.put('y', "и"); LAT_SINGLE.put('z', "з");
    }

    private static final String[][] CYR_MULTI = {
            {"щ", "shch"}, {"ш", "sh"}, {"ч", "ch"}, {"ц", "ts"},
            {"я", "ya"}, {"ю", "yu"}, {"ё", "yo"}, {"ж", "zh"}, {"х", "kh"},
    };

    private static final Map<Character, String> CYR_SINGLE = new HashMap<>();
    static {
        CYR_SINGLE.put('а', "a"); CYR_SINGLE.put('б', "b"); CYR_SINGLE.put('в', "v");
        CYR_SINGLE.put('г', "g"); CYR_SINGLE.put('д', "d"); CYR_SINGLE.put('е', "e");
        CYR_SINGLE.put('з', "z"); CYR_SINGLE.put('и', "i"); CYR_SINGLE.put('й', "y");
        CYR_SINGLE.put('к', "k"); CYR_SINGLE.put('л', "l"); CYR_SINGLE.put('м', "m");
        CYR_SINGLE.put('н', "n"); CYR_SINGLE.put('о', "o"); CYR_SINGLE.put('п', "p");
        CYR_SINGLE.put('р', "r"); CYR_SINGLE.put('с', "s"); CYR_SINGLE.put('т', "t");
        CYR_SINGLE.put('у', "u"); CYR_SINGLE.put('ф', "f");
        CYR_SINGLE.put('ъ', ""); CYR_SINGLE.put('ы', "i");
        CYR_SINGLE.put('ь', ""); CYR_SINGLE.put('э', "e");
    }

    public static String latToCyr(String s) {
        if (s == null || s.isEmpty()) return s;
        if (!hasLatin(s)) return s;
        String low = s.toLowerCase();
        StringBuilder sb = new StringBuilder(low.length());
        int i = 0;
        while (i < low.length()) {
            boolean found = false;
            for (String[] pair : LAT_MULTI) {
                if (low.startsWith(pair[0], i)) {
                    sb.append(pair[1]);
                    i += pair[0].length();
                    found = true;
                    break;
                }
            }
            if (!found) {
                char c = low.charAt(i);
                String mapped = LAT_SINGLE.get(c);
                if (mapped != null) sb.append(mapped);
                else sb.append(c);
                i++;
            }
        }
        return sb.toString();
    }

    public static String cyrToLat(String s) {
        if (s == null || s.isEmpty()) return s;
        if (!hasCyrillic(s)) return s;
        String low = s.toLowerCase();
        StringBuilder sb = new StringBuilder(low.length());
        int i = 0;
        while (i < low.length()) {
            boolean found = false;
            for (String[] pair : CYR_MULTI) {
                if (low.startsWith(pair[0], i)) {
                    sb.append(pair[1]);
                    i += pair[0].length();
                    found = true;
                    break;
                }
            }
            if (!found) {
                char c = low.charAt(i);
                String mapped = CYR_SINGLE.get(c);
                if (mapped != null) sb.append(mapped);
                else sb.append(c);
                i++;
            }
        }
        return sb.toString();
    }

    public static boolean hasLatin(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) return true;
        }
        return false;
    }

    public static boolean hasCyrillic(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c >= 'Ѐ' && c <= 'ӿ') return true;
        }
        return false;
    }
}
