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
}
