package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.service.PanelService;
import com.example.dori_qidiruv_bot.service.SorovChegarasi;
import com.example.dori_qidiruv_bot.service.YetkazishService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.Map;
import java.util.function.Supplier;

/**
 * Yetkazib berish: mijoz (buyurtma, chek, bekor), dorixona egasi (holat, to'lov, sozlama) va admin (ko'rish).
 * Xatolar matni foydalanuvchiga tushunarli qilib "xato" maydonida qaytadi.
 */
@RestController
@RequiredArgsConstructor
public class YetkazishController {

    private final YetkazishService service;
    private final PanelService panelService;
    private final SorovChegarasi chegara;

    // ---------------------------------------------------------------- mijoz

    /** Savatchada manzil tanlanganda: yetkazish mumkinmi va narxi qancha. */
    @GetMapping("/api/yetkazish/narx")
    public ResponseEntity<Map<String, Object>> narx(@RequestParam Long dorixonaId,
                                                    @RequestParam(required = false) Double lat,
                                                    @RequestParam(required = false) Double lon,
                                                    @RequestParam(defaultValue = "0") double summa) {
        return ResponseEntity.ok(service.narx(dorixonaId, lat, lon, Math.max(0, summa)));
    }

    @PostMapping("/api/yetkazish")
    public ResponseEntity<?> buyurtma(@AuthenticationPrincipal User mijoz, @RequestBody YetkazishService.Sorov sorov) {
        if (mijoz == null) return ResponseEntity.status(401).body(Map.of("xato", "Avval tizimga kiring"));
        // Bir mijozdan 10 daqiqada 10 tadan ko'p buyurtma kelmasin (dorixonalarni soxta buyurtmadan saqlaydi).
        if (chegara.tekshir("yetkazish:" + mijoz.getId(), 10, Duration.ofMinutes(10)) > 0) {
            return ResponseEntity.status(429).body(Map.of("xato", "Juda ko'p buyurtma. Birozdan keyin urinib ko'ring."));
        }
        return bajar(() -> service.buyurtmaBer(mijoz, sorov));
    }

    @GetMapping("/api/yetkazish/meniki")
    public ResponseEntity<?> meniki(@AuthenticationPrincipal User mijoz) {
        if (mijoz == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(service.mening(mijoz));
    }

    @PostMapping("/api/yetkazish/{id}/chek")
    public ResponseEntity<?> chek(@AuthenticationPrincipal User mijoz, @PathVariable long id,
                                  @RequestParam("chek") MultipartFile chek) {
        if (mijoz == null) return ResponseEntity.status(401).body(Map.of("xato", "Avval tizimga kiring"));
        if (chek.getSize() > 5L * 1024 * 1024) return ResponseEntity.badRequest().body(Map.of("xato", "Fayl 5 MB dan katta"));
        return bajar(() -> {
            try {
                return service.chekYukla(mijoz, id, chek.getBytes());
            } catch (java.io.IOException e) {
                throw new IllegalStateException("Chekni o'qib bo'lmadi");
            }
        });
    }

    @PostMapping("/api/yetkazish/{id}/bekor")
    public ResponseEntity<?> bekor(@AuthenticationPrincipal User mijoz, @PathVariable long id) {
        if (mijoz == null) return ResponseEntity.status(401).build();
        return bajar(() -> service.mijozBekorQil(mijoz, id));
    }

    @GetMapping("/api/yetkazish/{id}/chek")
    public ResponseEntity<byte[]> mijozChegi(@AuthenticationPrincipal User mijoz, @PathVariable long id) {
        if (mijoz == null) return ResponseEntity.status(401).build();
        return rasm(service.chek(id, null, mijoz.getId()));
    }

    // ---------------------------------------------------------------- dorixona egasi

    @GetMapping("/api/dorixonachi/yetkazish")
    public ResponseEntity<?> dorixona(@AuthenticationPrincipal User user) {
        Long dx = dorixonam(user);
        if (dx == null) return yoq();
        return ResponseEntity.ok(service.dorixonaniki(dx));
    }

    public record HolatSorovi(String holat, Integer daqiqa, String kuryerTelefon, String sabab) { }

    @PostMapping("/api/dorixonachi/yetkazish/{id}/holat")
    public ResponseEntity<?> holat(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody HolatSorovi s) {
        Long dx = dorixonam(user);
        if (dx == null) return yoq();
        return bajar(() -> service.holat(id, dx, s.holat(), s.daqiqa(), s.kuryerTelefon(), s.sabab()));
    }

    @PostMapping("/api/dorixonachi/yetkazish/{id}/tolov")
    public ResponseEntity<?> tolov(@AuthenticationPrincipal User user, @PathVariable long id) {
        Long dx = dorixonam(user);
        if (dx == null) return yoq();
        return bajar(() -> service.tolovTasdiqla(id, dx));
    }

    @GetMapping("/api/dorixonachi/yetkazish/{id}/chek")
    public ResponseEntity<byte[]> dorixonaChegi(@AuthenticationPrincipal User user, @PathVariable long id) {
        Long dx = dorixonam(user);
        if (dx == null) return ResponseEntity.status(403).build();
        return rasm(service.chek(id, dx, null));
    }

    @GetMapping("/api/dorixonachi/yetkazish-sozlama")
    public ResponseEntity<?> sozlama(@AuthenticationPrincipal User user) {
        Long dx = dorixonam(user);
        if (dx == null) return yoq();
        return ResponseEntity.ok(service.sozlama(dx));
    }

    @PutMapping("/api/dorixonachi/yetkazish-sozlama")
    public ResponseEntity<?> sozlamaYoz(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        Long dx = dorixonam(user);
        if (dx == null) return yoq();
        return bajar(() -> service.sozlamaYoz(dx, body));
    }

    // ---------------------------------------------------------------- admin

    @GetMapping("/api/admin/yetkazish")
    public ResponseEntity<?> admin() {
        return ResponseEntity.ok(service.barchasi());
    }

    // ---------------------------------------------------------------- yordamchilar

    private Long dorixonam(User user) {
        return user == null ? null : panelService.egasiDorixonasiId(user.getId(), user.getPhoneNumber());
    }

    private static ResponseEntity<Map<String, Object>> yoq() {
        return ResponseEntity.status(403).body(Map.of("xato", "Sizda dorixona yo'q"));
    }

    private static ResponseEntity<?> bajar(Supplier<Object> ish) {
        try {
            return ResponseEntity.ok(ish.get());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("xato", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("xato", e.getMessage()));
        }
    }

    private static ResponseEntity<byte[]> rasm(byte[] b) {
        if (b == null || b.length == 0) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(b);
    }
}
