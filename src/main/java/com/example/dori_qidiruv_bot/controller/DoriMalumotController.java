package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.service.DoriMalumotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** Dori yo'riqnomalari: sayt uchun o'qish (ochiq) va admin uchun boshqaruv. */
@RestController
@RequiredArgsConstructor
public class DoriMalumotController {

    private static final Set<String> REJIMLAR = Set.of("ustuvor", "toliq", "toxtatilgan");

    private final DoriMalumotService service;

    /** Dori oynasi uchun: nomi bo'yicha yo'riqnoma (qo'llanilishi, dozasi, qarshi ko'rsatmalari...). */
    @GetMapping("/api/dori/malumot")
    public ResponseEntity<Map<String, Object>> malumot(@RequestParam String nomi) {
        if (nomi.isBlank() || nomi.length() > 500) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(service.malumot(nomi));
    }

    @GetMapping("/api/admin/malumot/holat")
    public ResponseEntity<Map<String, Object>> holat() {
        return ResponseEntity.ok(service.holat());
    }

    @PostMapping("/api/admin/malumot/rejim")
    public ResponseEntity<Map<String, Object>> rejim(@RequestBody Map<String, String> body) {
        String rejim = body.get("rejim");
        if (!REJIMLAR.contains(rejim)) return ResponseEntity.badRequest().build();
        service.sozlamaYoz("malumot_rejim", rejim);
        return ResponseEntity.ok(service.holat());
    }

    @GetMapping("/api/admin/malumot")
    public ResponseEntity<List<Map<String, Object>>> royxat(@RequestParam(required = false) String q,
                                                             @RequestParam(required = false) String holat,
                                                             @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(service.qidir(q, holat, limit));
    }

    @PutMapping("/api/admin/malumot/{id}")
    public ResponseEntity<Map<String, Object>> tahrirla(@PathVariable Long id, @RequestBody String malumotJson) {
        try {
            service.tahrirla(id, malumotJson);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("xato", "JSON noto'g'ri: " + e.getMessage()));
        }
    }

    @PostMapping("/api/admin/malumot/{id}/qayta")
    public ResponseEntity<Map<String, Object>> qayta(@PathVariable Long id) {
        service.qaytaYozdir(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
