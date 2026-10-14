package com.example.dori_qidiruv_bot.service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Telegram Mini App initData imzosini tekshiradi (mijozlar botidagi InitDataValidator bilan
 * bir xil algoritm). Sayt buni dorixonalar boti uchun ishlatadi: o'sha botdan ochilgan Mini
 * App initData'si dorixonalar botining tokeni bilan imzolangan bo'ladi.
 *
 *   secret_key = HMAC_SHA256(kalit="WebAppData", ma'lumot=bot_token)
 *   hash       = hex(HMAC_SHA256(kalit=secret_key, ma'lumot=data_check_string))
 */
public final class TelegramInitData {

    /** initData qancha vaqt amal qiladi (soniya). */
    private static final long MAX_AGE_SECONDS = 24 * 60 * 60;

    private TelegramInitData() { }

    /** Imzo to'g'ri va eskirmagan bo'lsa "user" JSON matnini, aks holda null qaytaradi. */
    public static String validateAndExtractUser(String initData, String botToken) {
        if (initData == null || initData.isBlank() || botToken == null || botToken.isBlank()) return null;
        Map<String, String> params = parse(initData);
        String hash = params.remove("hash");
        if (hash == null || hash.isBlank()) return null;
        if (isExpired(params.get("auth_date"))) return null;

        List<String> pairs = new ArrayList<>();
        for (Map.Entry<String, String> e : params.entrySet()) pairs.add(e.getKey() + "=" + e.getValue());
        Collections.sort(pairs);
        String dataCheckString = String.join("\n", pairs);
        try {
            byte[] secretKey = hmac("WebAppData".getBytes(StandardCharsets.UTF_8), botToken.trim().getBytes(StandardCharsets.UTF_8));
            String expected = toHex(hmac(secretKey, dataCheckString.getBytes(StandardCharsets.UTF_8)));
            if (!constantTimeEquals(expected, hash)) return null;
        } catch (Exception e) {
            return null;
        }
        String user = params.get("user");
        return user == null || user.isBlank() ? null : user;
    }

    private static boolean isExpired(String authDate) {
        if (authDate == null || authDate.isBlank()) return true;
        try {
            long age = System.currentTimeMillis() / 1000L - Long.parseLong(authDate.trim());
            return age > MAX_AGE_SECONDS;
        } catch (NumberFormatException e) {
            return true;
        }
    }

    private static byte[] hmac(byte[] key, byte[] data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data);
    }

    private static Map<String, String> parse(String initData) {
        Map<String, String> params = new HashMap<>();
        for (String pair : initData.split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            params.put(URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8),
                    URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8));
        }
        return params;
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int diff = 0;
        for (int i = 0; i < a.length(); i++) diff |= a.charAt(i) ^ b.charAt(i);
        return diff == 0;
    }
}
