package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.dto.AuthRequest;
import com.example.dori_qidiruv_bot.dto.AuthResponse;
import com.example.dori_qidiruv_bot.dto.UpdateNameRequest;
import com.example.dori_qidiruv_bot.dto.VerifyRequest;
import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;

    @org.springframework.beans.factory.annotation.Value("${telegram.bot-username:dori_UzBot}")
    private String botUsername;

    /**
     * Telefon raqam yuborish - SMS kod olish
     */
    @PostMapping("/send-code")
    public ResponseEntity<AuthResponse> sendCode(@RequestBody AuthRequest request) {
        try {
            String message = authService.sendVerificationCode(request.getPhoneNumber());
            return ResponseEntity.ok(new AuthResponse(null, message));
        } catch (Exception e) {
            // Kod hech qanday kanal orqali yetib bormadi — foydalanuvchiga nima qilish kerakligini aytamiz.
            if ("KOD_YETKAZILMADI".equals(e.getMessage())) {
                return ResponseEntity.badRequest().body(new AuthResponse(null,
                        "Kodni yuborib bo'lmadi. Iltimos, Telegramda @" + botUsername
                                + " botiga /start bosib, telefon raqamingizni ulashing va qaytadan urinib ko'ring."));
            }
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, "Xatolik: " + e.getMessage()));
        }
    }

    /**
     * Kodni tekshirish va token olish
     */
    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verify(@RequestBody VerifyRequest request) {
        try {
            String token = authService.verifyCode(request.getPhoneNumber(), request.getCode());
            return ResponseEntity.ok(new AuthResponse(token, "Muvaffaqiyatli"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new AuthResponse(null, "Xatolik: " + e.getMessage()));
        }
    }

    /**
     * Profil ma'lumotlarini olish
     */
    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(@RequestHeader("Authorization") String token) {
        try {
            // "Bearer " prefiksini olib tashlash
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            User user = authService.getUserByToken(token);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Ro'yxatdan o'tishning oxirgi bosqichi - foydalanuvchi ismini saqlash
     */
    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestHeader("Authorization") String token,
                                               @RequestBody UpdateNameRequest request) {
        try {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            User user = authService.updateName(token, request.getName());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
