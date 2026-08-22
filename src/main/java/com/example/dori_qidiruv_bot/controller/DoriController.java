package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.dto.DoriQidiruvResponse;
import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.service.DoriService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dori")
@RequiredArgsConstructor
public class DoriController {
    private final DoriService doriService;

    @GetMapping("/qidirish")
    public ResponseEntity<List<DoriQidiruvResponse>> doriQidirish(@RequestParam String nomi) {
        List<DoriQidiruvResponse> natijalar = doriService.qidirish(nomi);
        if (natijalar.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(natijalar);
    }

    @PostMapping
    public ResponseEntity<Dori> doriQoshish(@RequestBody Dori dori) {
        return ResponseEntity.ok(doriService.doriQoshish(dori));
    }

    @GetMapping
    public ResponseEntity<List<Dori>> barchaDorilar() {
        return ResponseEntity.ok(doriService.barchaDorilar());
    }

    /** Dorini yangilash (narx, mavjudlik va h.k.) — admin panelida tahrirlash uchun.
     *  Faqat yuborilgan maydonlar o'zgaradi; nom/firma/dorixona saqlanib qoladi. */
    @PutMapping("/{id}")
    public ResponseEntity<Dori> doriYangilash(@PathVariable Long id, @RequestBody Dori dori) {
        return ResponseEntity.ok(doriService.doriYangilash(id, dori));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> doriOchirish(@PathVariable Long id) {
        doriService.doriOchirish(id);
        return ResponseEntity.noContent().build();
    }
}
