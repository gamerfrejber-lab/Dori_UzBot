package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.DoriKatalog;
import com.example.dori_qidiruv_bot.service.DoriService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Dori katalogi (butun O'zbekiston ro'yxati) API'si.
 * Dorixona egasi admin panelida dori qo'shganda shu yerdan nom tanlaydi.
 */
@RestController
@RequestMapping("/api/katalog")
@RequiredArgsConstructor
public class DoriKatalogController {

    private final DoriService doriService;

    /** Katalogdan qidirish (avtomatik to'ldirish uchun). q — qidiruv matni, limit — natijalar soni. */
    @GetMapping("/qidirish")
    public ResponseEntity<List<DoriKatalog>> qidirish(
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(doriService.katalogQidirish(q, limit));
    }

    /** Autocomplete — faqat dori nomi bo'yicha qidiruv, prefix match birinchi. */
    @GetMapping("/autocomplete")
    public ResponseEntity<List<DoriKatalog>> autocomplete(
            @RequestParam String q,
            @RequestParam(defaultValue = "15") int limit) {
        return ResponseEntity.ok(doriService.katalogAutocomplete(q, limit));
    }

    /** Katalogdagi jami dorilar soni (bosh sahifada ko'rsatish uchun — ochiq). */
    @GetMapping("/soni")
    public ResponseEntity<Map<String, Long>> soni() {
        return ResponseEntity.ok(Map.of("jami", doriService.katalogSoni()));
    }

    /** Katalogni sahifalab ko'rish: jami soni + shu sahifadagi dorilar. q ixtiyoriy (qidiruv). */
    @GetMapping("/royxat")
    public ResponseEntity<Map<String, Object>> royxat(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(doriService.katalogRoyxat(q, page, size));
    }
}
