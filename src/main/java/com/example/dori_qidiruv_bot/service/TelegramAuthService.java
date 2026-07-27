package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Telegram Mini App orqali kirish. Sayt Telegram ichida ochilganda telefon raqam va SMS
 * kod so'ralmaydi — Telegram bergan initData imzosi foydalanuvchini ishonchli aniqlaydi.
 *
 * Imzoni bot xizmati tekshiradi (bot tokeni faqat o'sha yerda), shu sababli veb-saytga
 * qo'shimcha maxfiy sozlama kerak emas.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TelegramAuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final RestClient botClient = RestClient.builder()
            .requestFactory(botRequestFactory())
            .build();

    @Value("${telegram.notify.url:}")
    private String telegramNotifyUrl;

    @Value("${telegram.notify.token:}")
    private String telegramNotifyToken;

    private static SimpleClientHttpRequestFactory botRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(20));
        factory.setReadTimeout(Duration.ofSeconds(90));
        return factory;
    }

    /**
     * initData'ni botga tekshirtiradi, foydalanuvchini bazaga yozadi (yo'q bo'lsa yaratadi)
     * va JWT token qaytaradi. Imzo yaroqsiz bo'lsa xato tashlaydi.
     */
    public String loginWithInitData(String initData) {
        String userJson = validateViaBot(initData);
        if (userJson == null) {
            throw new IllegalStateException("IMZO_YAROQSIZ");
        }

        JsonNode node;
        try {
            node = objectMapper.readTree(userJson);
        } catch (Exception e) {
            throw new IllegalStateException("IMZO_YAROQSIZ");
        }

        long telegramId = node.path("id").asLong();
        if (telegramId == 0) {
            throw new IllegalStateException("IMZO_YAROQSIZ");
        }

        User user = userRepository.findById(telegramId).orElseGet(() -> {
            User created = new User();
            created.setId(telegramId);
            created.setCreatedAt(LocalDateTime.now());
            return created;
        });

        String fullName = buildFullName(node);
        if (!fullName.isBlank()) user.setName(fullName);
        user.setIsVerified(true);
        user.setLastLoginAt(LocalDateTime.now());
        user.setVerificationCode(null);
        user.setCodeExpiry(null);
        userRepository.save(user);

        log.info("Mini App orqali kirdi: telegramId={}", telegramId);
        return jwtService.generateToken(user);
    }

    private String buildFullName(JsonNode node) {
        String first = node.path("first_name").asText("");
        String last = node.path("last_name").asText("");
        return (first + " " + last).trim();
    }

    /** Botdan initData imzosini tekshirishni so'raydi. To'g'ri bo'lsa "user" JSON'i qaytadi. */
    private String validateViaBot(String initData) {
        if (telegramNotifyUrl.isBlank()) return null;
        String url = telegramNotifyUrl.replace("/send-code", "/validate-initdata")
                + "?token=" + URLEncoder.encode(telegramNotifyToken, StandardCharsets.UTF_8);
        try {
            return botClient.post().uri(url).body(initData).retrieve().body(String.class);
        } catch (Exception e) {
            log.warn("initData'ni botga tekshirtirib bo'lmadi, url={}: {}", url, e.getMessage());
            return null;
        }
    }
}
