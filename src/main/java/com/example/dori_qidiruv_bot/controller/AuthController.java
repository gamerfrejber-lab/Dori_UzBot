package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.dto.AuthRequest;
import com.example.dori_qidiruv_bot.dto.AuthResponse;
import com.example.dori_qidiruv_bot.dto.UpdateNameRequest;
import com.example.dori_qidiruv_bot.dto.VerifyRequest;
import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.service.AuthService;
import com.example.dori_qidiruv_bot.service.TelegramAuthService;
import com.example.dori_qidiruv_bot.service.SorovChegarasi;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final TelegramAuthService telegramAuthService;
    private final SorovChegarasi chegara;

    @org.springframework.beans.factory.annotation.Value("${telegram.bot-username:dori_UzBot}")
    private String botUsername;

    /**
     * Telefon raqam yuborish - SMS kod olish
     */
    @PostMapping("/send-code")
    public ResponseEntity<AuthResponse> sendCode(@RequestBody AuthRequest request, HttpServletRequest http) {
        // Bir raqamga: daqiqasiga 1 ta, soatiga 5 ta kod; bir IP'dan 10 daqiqada 10 ta.
        String raqam = raqam(request.getPhoneNumber());
        long kut = Math.max(chegara.tekshir("kod:tel:" + raqam, 1, Duration.ofMinutes(1)),
                Math.max(chegara.tekshir("kod:telsoat:" + raqam, 5, Duration.ofHours(1)),
                        chegara.tekshir("kod:ip:" + http.getRemoteAddr(), 10, Duration.ofMinutes(10))));
        if (kut > 0) return juda(kut, new AuthResponse(null, kutish(kut)));
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
     * Telegram Mini App orqali kirish — telefon va SMS kodsiz, initData imzosi asosida
     */
    @PostMapping("/telegram")
    public ResponseEntity<Map<String, Object>> loginWithTelegram(@RequestBody Map<String, String> request,
                                                                 HttpServletRequest http) {
        long kut = chegara.tekshir("tg:ip:" + http.getRemoteAddr(), 30, Duration.ofMinutes(1));
        if (kut > 0) return juda(kut, Map.of("message", kutish(kut)));
        try {
            TelegramAuthService.Natija n = telegramAuthService.loginWithInitData(request.get("initData"));
            return ResponseEntity.ok(Map.of("token", n.token(), "message", "Muvaffaqiyatli", "manba", n.manba()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Telegram orqali kirib bo'lmadi"));
        }
    }

    /**
     * Kodni tekshirish va token olish
     */
    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verify(@RequestBody VerifyRequest request, HttpServletRequest http) {
        // 6 xonali kodni tanlab topib bo'lmasin: bir raqamga 10 daqiqada 5 urinish, bir IP'dan 30 urinish.
        String raqam = raqam(request.getPhoneNumber());
        long kut = Math.max(chegara.tekshir("tekshir:tel:" + raqam, 5, Duration.ofMinutes(10)),
                chegara.tekshir("tekshir:ip:" + http.getRemoteAddr(), 30, Duration.ofMinutes(10)));
        if (kut > 0) return juda(kut, new AuthResponse(null, kutish(kut)));
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

    private static String raqam(String telefon) {
        String r = telefon == null ? "" : telefon.replaceAll("[^0-9]", "");
        return r.length() > 9 ? r.substring(r.length() - 9) : r;
    }

    private static String kutish(long soniya) {
        return soniya >= 60
                ? "Juda ko'p urinish. " + ((soniya + 59) / 60) + " daqiqadan keyin qayta urinib ko'ring."
                : "Juda ko'p urinish. " + soniya + " soniyadan keyin qayta urinib ko'ring.";
    }

    private static <T> ResponseEntity<T> juda(long soniya, T body) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(soniya))
                .body(body);
    }
}
