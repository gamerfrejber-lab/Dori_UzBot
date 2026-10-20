package com.example.dori_qidiruv_bot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.TimeUnit;

/**
 * Statik fayllar keshi. Vite yig'gan /assets/* fayllari nomida xesh bor (index-Q2vbmiKB.js) — mazmuni o'zgarsa
 * nomi ham o'zgaradi, shuning uchun brauzer ularni 1 yil saqlaydi va serverga qayta so'rov yubormaydi.
 * index.html va boshqalar har safar tekshiriladi (o'zgarmagan bo'lsa 304) — yangi deploy darhol ko'rinadi.
 */
@Configuration
public class StatikFayllar implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable());
        registry.addResourceHandler("/icons/**")
                .addResourceLocations("classpath:/static/icons/")
                .setCacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic());
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noCache());
    }
}
