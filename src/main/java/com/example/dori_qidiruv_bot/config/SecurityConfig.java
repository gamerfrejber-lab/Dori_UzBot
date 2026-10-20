package com.example.dori_qidiruv_bot.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins:}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/*.html", "/*.js", "/*.css", "/*.ico",
                                "/*.png", "/*.svg", "/*.json", "/*.txt", "/*.xml", "/*.webmanifest",
                                "/assets/**", "/icons/**",
                                "/dorixonalar", "/login", "/sms", "/profil", "/admin", "/dorixonachi",
                                "/kategoriya/**",
                                "/api/auth/**",
                                "/css/**", "/js/**", "/images/**").permitAll()
                        // Admin ekanini tekshirish hammaga ochiq (token bo'lmasa "admin emas" deydi),
                        // qolgan admin ma'lumotlari faqat adminga.
                        .requestMatchers("/api/health").permitAll()
                        // Xato sahifasi ochiq: aks holda har qanday 404/500 xato 401 bo'lib ko'rinib,
                        // sayt foydalanuvchini bekorga tizimdan chiqarib yuboradi.
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/api/admin/check").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/dorixonachi/check").authenticated()
                        .requestMatchers("/api/dorixonachi/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/bron/*/chek").permitAll()
                        // Dorilar, narxlar va dorixonalar mehmonlarga ham ko'rinadi (bosh sahifa va qidiruv ochiq);
                        // profil va bron qilish esa ro'yxatdan o'tishni talab qiladi.
                        // Barcha dorilar ro'yxati (sahifalanmagan, 1 mln qatorgacha) — faqat admin; aks holda bitta so'rov
                        // bilan serverni band qilish mumkin edi. Sayt bu endpointni ishlatmaydi.
                        .requestMatchers(HttpMethod.GET, "/api/dori").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/dori/**", "/api/dorixona/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/katalog/qidirish", "/api/katalog/autocomplete", "/api/katalog/soni").permitAll()
                        // Katalogni to'liq sahifalab ko'rish (browse) — faqat admin.
                        .requestMatchers(HttpMethod.GET, "/api/katalog/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/dori/**", "/api/dorixona/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/dori/**", "/api/dorixona/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/dori/**", "/api/dorixona/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                // Token yo'q yoki eskirgan bo'lsa 401 — sayt shunga qarab kirish sahifasini ochadi.
                .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        if (allowedOrigins == null || allowedOrigins.isEmpty() || allowedOrigins.get(0).isBlank()) {
            configuration.setAllowedOriginPatterns(List.of("https://doriqidiruv.com", "https://www.doriqidiruv.com", "https://*.onrender.com", "https://*.up.railway.app", "http://localhost:*"));
        } else {
            // Sozlamadagi manzillarga saytning o'z domeni har doim qo'shiladi.
            List<String> origins = new java.util.ArrayList<>(allowedOrigins);
            origins.add("https://doriqidiruv.com");
            origins.add("https://www.doriqidiruv.com");
            configuration.setAllowedOriginPatterns(origins);
        }
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
