package com.example.dori_qidiruv_bot.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.security.SecureRandom;
import java.util.Map;

@Service
@Slf4j
public class SmsService {

    private final SecureRandom random = new SecureRandom();
    private final RestClient restClient = RestClient.create();

    /**
     * Bot xizmatiga murojaat uchun alohida klient: Render'ning bepul tarifida bot uzoq
     * faolsizlikdan keyin "uxlab qoladi" va uyg'onishi 30 soniyagacha cho'zilishi mumkin.
     * Standart qisqa timeout bunday holatda so'rovni uzib qo'yardi va kod yetib bormasdi.
     */
    private final RestClient botClient = RestClient.builder()
            .requestFactory(botRequestFactory())
            .build();

    private static SimpleClientHttpRequestFactory botRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(20));
        factory.setReadTimeout(Duration.ofSeconds(90));
        return factory;
    }

    @Value("${eskiz.base-url}")
    private String baseUrl;

    @Value("${eskiz.email:}")
    private String email;

    @Value("${eskiz.password:}")
    private String password;

    @Value("${eskiz.from:4546}")
    private String from;

    @Value("${telegram.notify.url:}")
    private String telegramNotifyUrl;

    @Value("${telegram.notify.token:}")
    private String telegramNotifyToken;

    private volatile String cachedToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    /**
     * Tasdiqlash kodini yetkazadi. Avval Telegram bot orqali urinadi (foydalanuvchi botga
     * /start bosgan bo'lishi kerak), keyin Eskiz.uz SMS orqali. Hech biri ishlamasa
     * IllegalStateException tashlaydi — shunda foydalanuvchiga "yuborildi" deb yolg'on
     * aytilmaydi, balki nima qilish kerakligi ko'rsatiladi.
     */
    public void sendVerificationCode(String phoneNumber, String code) {
        if (sendViaTelegram(phoneNumber, code)) {
            log.info("Kod Telegram bot orqali yuborildi: {}", phoneNumber);
            return;
        }

        if (!email.isBlank() && !password.isBlank()) {
            try {
                sendViaEskiz(phoneNumber, "Dori Qidiruv tasdiqlash kodi: " + code);
                log.info("SMS Eskiz orqali yuborildi: {}", phoneNumber);
                return;
            } catch (Exception e) {
                log.error("Eskiz orqali SMS yuborib bo'lmadi ({})", phoneNumber, e);
            }
        }

        // Hech qanday kanal ishlamadi: kodni faqat logga yozamiz va xato qaytaramiz.
        log.warn("Kodni yetkazib bo'lmadi: {}", phoneNumber);
        throw new IllegalStateException("KOD_YETKAZILMADI");
    }

    /**
     * Telegram bot orqali yuborishga urinadi. Foydalanuvchi botga /start bosmagan bo'lsa
     * yoki bot ishlamayotgan bo'lsa false qaytaradi (keyingi kanal sinaladi).
     */
    private boolean sendViaTelegram(String phoneNumber, String code) {
        if (telegramNotifyUrl.isBlank()) return false;
        try {
            String url = telegramNotifyUrl
                    + "?phone=" + URLEncoder.encode(phoneNumber, StandardCharsets.UTF_8)
                    + "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8);
            botClient.post()
                    .uri(url)
                    .header("X-Internal-Token", telegramNotifyToken)
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (Exception e) {
            log.warn("Telegram bot orqali yuborib bo'lmadi ({}), url={}: {}",
                    phoneNumber, telegramNotifyUrl, e.getMessage());
            return false;
        }
    }

    private void sendViaEskiz(String phoneNumber, String message) {
        String digitsOnly = phoneNumber.replaceAll("[^0-9]", "");

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("mobile_phone", digitsOnly);
        body.add("message", message);
        body.add("from", from);

        restClient.post()
                .uri(baseUrl + "/message/sms/send")
                .header("Authorization", "Bearer " + getToken())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .toBodilessEntity();
    }

    private synchronized String getToken() {
        if (cachedToken != null && Instant.now().isBefore(tokenExpiresAt)) {
            return cachedToken;
        }

        MultiValueMap<String, String> loginBody = new LinkedMultiValueMap<>();
        loginBody.add("email", email);
        loginBody.add("password", password);

        Map<String, Object> response = restClient.post()
                .uri(baseUrl + "/auth/login")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(loginBody)
                .retrieve()
                .body(Map.class);

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.get("data");
        cachedToken = (String) data.get("token");
        // Eskiz tokeni ~30 kun amal qiladi, 29 kundan keyin qayta login qilamiz
        tokenExpiresAt = Instant.now().plusSeconds(29L * 24 * 60 * 60);
        return cachedToken;
    }

    /**
     * 6 xonali tasodifiy kod generatsiya qilish
     */
    public String generateVerificationCode() {
        return String.format("%06d", random.nextInt(1000000));
    }
}
