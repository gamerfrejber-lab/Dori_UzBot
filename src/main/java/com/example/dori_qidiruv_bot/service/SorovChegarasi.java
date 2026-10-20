package com.example.dori_qidiruv_bot.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * So'rovlar sonini cheklash (rate limit): "shu kalit bo'yicha oynada ko'pi bilan N ta".
 * Oyna birinchi so'rovdan boshlanadi; hisoblagichlar xotirada (Caffeine), oyna tugagach o'zi o'chadi.
 * SMS kodi va kirish endpointlarini Eskiz pulini sovuradigan va kodni tanlab topishga urinadigan hujumlardan saqlaydi.
 */
@Component
public class SorovChegarasi {

    private record Hisob(long boshlandi, AtomicInteger soni) { }

    /** Har oyna uzunligi uchun alohida kesh (muddati shu oynaga teng). */
    private final Map<Duration, Cache<String, Hisob>> oynalar = new ConcurrentHashMap<>();

    /**
     * So'rovni hisobga oladi. Ruxsat bo'lsa 0, aks holda qancha soniyadan keyin urinish mumkinligini qaytaradi.
     */
    public long tekshir(String kalit, int max, Duration oyna) {
        Cache<String, Hisob> kesh = oynalar.computeIfAbsent(oyna, o -> Caffeine.newBuilder()
                .expireAfterWrite(o)
                .maximumSize(200_000)
                .build());
        Hisob h = kesh.get(kalit, k -> new Hisob(System.currentTimeMillis(), new AtomicInteger()));
        if (h.soni().incrementAndGet() <= max) return 0;
        long qoldi = (h.boshlandi() + oyna.toMillis() - System.currentTimeMillis()) / 1000;
        return Math.max(1, qoldi);
    }
}
