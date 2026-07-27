package com.example.dori_qidiruv_bot.config;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.repository.UserRepository;
import com.example.dori_qidiruv_bot.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Bearer tokenni tekshirib, haqiqiy foydalanuvchi bo'lsa SecurityContext'ga
 * ROLE_USER (va admin ro'yxatidagi raqam bo'lsa ROLE_ADMIN) authority bilan yozadi.
 * Token yo'q/yaroqsiz bo'lsa shunchaki keyingi filtrga o'tkazadi — permitAll bo'lgan
 * yo'llar baribir ishlayveradi, faqat authenticated()/hasRole talab qilinganda to'sqinlik qiladi.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${app.admin-phones:}")
    private String adminPhonesRaw;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                if (jwtService.validateToken(token)) {
                    Long userId = jwtService.getUserIdFromToken(token);
                    User user = userRepository.findById(userId).orElse(null);
                    if (user != null) {
                        List<GrantedAuthority> authorities = new ArrayList<>();
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                        if (isAdminPhone(user.getPhoneNumber())) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                        }
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(user, null, authorities);
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            } catch (Exception ignored) {
                // Yaroqsiz token — autentifikatsiya qilinmagan holda davom etadi.
            }
        }
        filterChain.doFilter(request, response);
    }

    /**
     * Faqat raqamlar bo'yicha solishtiradi: baza "998..." ko'rinishida saqlashi, sozlamada esa
     * "+998..." yozilgan bo'lishi mumkin — bunday farq admin huquqini yo'qotmasligi kerak.
     */
    private boolean isAdminPhone(String phoneNumber) {
        String normalized = onlyDigits(phoneNumber);
        if (normalized.isEmpty() || adminPhonesRaw == null || adminPhonesRaw.isBlank()) return false;
        Set<String> adminPhones = Arrays.stream(adminPhonesRaw.split(","))
                .map(JwtAuthenticationFilter::onlyDigits)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
        return adminPhones.contains(normalized);
    }

    private static String onlyDigits(String value) {
        return value == null ? "" : value.replaceAll("[^0-9]", "");
    }
}
