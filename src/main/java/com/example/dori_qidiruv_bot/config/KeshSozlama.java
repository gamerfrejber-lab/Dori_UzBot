package com.example.dori_qidiruv_bot.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.List;

/**
 * Ko'p so'raladigan, kam o'zgaradigan javoblar uchun xotiradagi kesh (Caffeine).
 * Har keshning yashash muddati va hajmi chegaralangan — xotira (320 MB heap) to'lib qolmasin.
 * Narx va qoldiq tez o'zgargani uchun dorixonalardagi dorilar qidiruvi atigi 15 soniya saqlanadi.
 */
@Configuration
@EnableCaching
public class KeshSozlama {

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager boshqaruvchi = new SimpleCacheManager();
        boshqaruvchi.setCaches(List.of(
                kesh("katalogAutocomplete", Duration.ofMinutes(10), 5_000),
                kesh("katalogQidirish", Duration.ofMinutes(10), 3_000),
                kesh("katalogSoni", Duration.ofMinutes(10), 1),
                kesh("dorixonalar", Duration.ofSeconds(15), 1),
                kesh("doriQidirish", Duration.ofSeconds(15), 1_000),
                kesh("kategoriya", Duration.ofSeconds(60), 64)));
        return boshqaruvchi;
    }

    private static CaffeineCache kesh(String nom, Duration muddat, long hajm) {
        return new CaffeineCache(nom, Caffeine.newBuilder()
                .expireAfterWrite(muddat)
                .maximumSize(hajm)
                .recordStats()
                .build());
    }
}
