package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final SmsService smsService;
    private final JwtService jwtService;

    /**
     * Telefon raqam orqali SMS kod yuborish
     */
    public String sendVerificationCode(String phoneNumber) {
        // Telefon raqamni tozalash (+998 prefixi bilan)
        phoneNumber = cleanPhoneNumber(phoneNumber);
        
        // Kod generatsiya qilish
        String code = smsService.generateVerificationCode();

        // Foydalanuvchi yozuvi botda /start bosilganda yaratiladi — bu yerda faqat topamiz.
        // Topilmasa kodni yetkazishning ham imkoni yo'q, shuning uchun darhol aytamiz.
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new IllegalStateException("KOD_YETKAZILMADI"));

        // Kodni saqlash (5 daqiqa amal qiladi)
        user.setVerificationCode(code);
        user.setCodeExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Kodni yetkazish (Telegram bot, keyin SMS) — yetkazilmasa xato tashlanadi
        smsService.sendVerificationCode(phoneNumber, code);

        return "Kod yuborildi";
    }

    /**
     * Kodni tekshirish va JWT token qaytarish
     */
    public String verifyCode(String phoneNumber, String code) {
        phoneNumber = cleanPhoneNumber(phoneNumber);
        
        User user = userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("User topilmadi"));
        
        if (user.getVerificationCode() == null
                || !MessageDigest.isEqual(code.getBytes(), user.getVerificationCode().getBytes())) {
            throw new RuntimeException("Noto'g'ri kod");
        }

        if (user.getCodeExpiry() == null || user.getCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Kod muddati tugagan");
        }
        
        // Userni tasdiqlash
        user.setIsVerified(true);
        user.setLastLoginAt(LocalDateTime.now());
        user.setVerificationCode(null);
        user.setCodeExpiry(null);
        userRepository.save(user);
        
        // JWT token yaratish
        return jwtService.generateToken(user);
    }

    /**
     * Telefon raqamni xalqaro formatga keltiradi.
     * Mamlakat kodi bilan kelgan bo'lsa o'sha saqlanadi, kodsiz (milliy) kelsa uzunligiga
     * qarab aniqlanadi: 9 xonali — O'zbekiston (+998), 10 xonali — Rossiya (+7).
     * Rossiyada ichki formatda ishlatiladigan 8 bilan boshlanuvchi raqam ham +7 ga o'giriladi.
     */
    private String cleanPhoneNumber(String phoneNumber) {
        String digits = phoneNumber == null ? "" : phoneNumber.replaceAll("[^0-9]", "");
        if (digits.length() == 12 && digits.startsWith("998")) return "+" + digits;
        if (digits.length() == 11 && digits.startsWith("7")) return "+" + digits;
        if (digits.length() == 11 && digits.startsWith("8")) return "+7" + digits.substring(1);
        if (digits.length() == 9) return "+998" + digits;
        if (digits.length() == 10) return "+7" + digits;
        return "+" + digits;
    }

    /**
     * Token orqali userni topish
     */
    public User getUserByToken(String token) {
        Long userId = jwtService.getUserIdFromToken(token);
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User topilmadi"));
    }

    /**
     * Token orqali userning ismini yangilash (ro'yxatdan o'tishning oxirgi bosqichi)
     */
    public User updateName(String token, String name) {
        User user = getUserByToken(token);
        user.setName(name);
        return userRepository.save(user);
    }
}
