package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import com.example.dori_qidiruv_bot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Veb-sayt admin paneli uchun ma'lumotlar (botdagi admin bo'limiga mos). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final DorixonaRepository dorixonaRepository;
    private final DoriRepository doriRepository;

    /**
     * Joriy foydalanuvchi admin yoki yo'qligini aytadi — sayt shunga qarab admin bo'limini
     * ko'rsatadi. Token bo'lmasa ham xato bermaydi, shunchaki admin emas deb javob beradi.
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> check(Authentication authentication) {
        boolean admin = authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
        return ResponseEntity.ok(Map.of("admin", admin));
    }

    /** Ro'yxatdan o'tgan foydalanuvchilar (faqat admin uchun). */
    @GetMapping("/users")
    public ResponseEntity<List<User>> users() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    /** Umumiy statistika: foydalanuvchi, dorixona va dori soni. */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(Map.of(
                "users", userRepository.count(),
                "pharmacies", dorixonaRepository.count(),
                "drugs", doriRepository.count()
        ));
    }
}
