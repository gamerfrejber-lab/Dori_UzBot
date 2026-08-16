package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.service.BronService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Saytdan bron qilish. Bron umumiy jadvalga yozilgani uchun dorixona egasiga xabar
 * dorixonalar boti orqali boradi va javobi mijozga Telegram'da qaytadi.
 */
@RestController
@RequestMapping("/api/bron")
@RequiredArgsConstructor
public class BronController {

    private final BronService bronService;

    /** Bron so'rovi tanasi. */
    public record BronRequest(Long doriId, int soni, String turi) { }

    @PostMapping
    public ResponseEntity<Map<String, Object>> bronQil(@AuthenticationPrincipal User mijoz,
                                                       @RequestBody BronRequest so_rov) {
        if (mijoz == null) {
            return ResponseEntity.status(401).body(Map.of("xato", "Avval tizimga kiring"));
        }
        try {
            return ResponseEntity.ok(bronService.bronQil(mijoz, so_rov.doriId(), so_rov.soni(), so_rov.turi()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("xato", e.getMessage()));
        } catch (IllegalStateException e) {
            // Qoldiq yetmadi — mijozga aniq sabab aytiladi.
            return ResponseEntity.status(409).body(Map.of("xato", e.getMessage()));
        }
    }

    /** Foydalanuvchining bronlari: holati va olib ketish kodi bilan. */
    @GetMapping("/meniki")
    public ResponseEntity<List<Map<String, Object>>> meningBronlarim(@AuthenticationPrincipal User mijoz) {
        if (mijoz == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(bronService.meningBronlarim(mijoz));
    }
}
