package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.service.BronService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bron")
@RequiredArgsConstructor
public class BronController {

    private final BronService bronService;

    public record BronRequest(Long doriId, int soni, String tur) { }

    @PostMapping
    public ResponseEntity<Map<String, Object>> bronQil(@AuthenticationPrincipal User mijoz,
                                                       @RequestBody BronRequest so_rov) {
        if (mijoz == null) {
            return ResponseEntity.status(401).body(Map.of("xato", "Avval tizimga kiring"));
        }
        try {
            return ResponseEntity.ok(bronService.bronQil(mijoz, so_rov.doriId(), so_rov.soni(), so_rov.tur()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("xato", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("xato", e.getMessage()));
        }
    }

    @PostMapping("/{id}/chek")
    public ResponseEntity<Map<String, Object>> chekYuklash(@AuthenticationPrincipal User mijoz,
                                                            @PathVariable Long id,
                                                            @RequestParam("chek") MultipartFile chek) {
        if (mijoz == null) {
            return ResponseEntity.status(401).body(Map.of("xato", "Avval tizimga kiring"));
        }
        try {
            byte[] rasmi = chek.getBytes();
            if (rasmi.length > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("xato", "Fayl 5 MB dan katta"));
            }
            return ResponseEntity.ok(bronService.chekYuklash(mijoz, id, rasmi));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("xato", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("xato", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("xato", "Chekni yuklab bo'lmadi"));
        }
    }

    @GetMapping("/{id}/chek")
    public ResponseEntity<byte[]> chekOlish(@PathVariable Long id) {
        byte[] chek = bronService.chekOlish(id);
        if (chek == null || chek.length == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(chek);
    }

    @GetMapping("/meniki")
    public ResponseEntity<List<Map<String, Object>>> meningBronlarim(@AuthenticationPrincipal User mijoz) {
        if (mijoz == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(bronService.meningBronlarim(mijoz));
    }
}
