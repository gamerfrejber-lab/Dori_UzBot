package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.Bron;
import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.entity.Dorixona;
import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.repository.BronRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import com.example.dori_qidiruv_bot.service.DoriService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Dorixona egasi paneli — botdagi imkoniyatlarning saytdagi versiyasi.
 * Foydalanuvchi o'z dorixonasining dorilarini, bronlarini boshqaradi.
 */
@RestController
@RequestMapping("/api/dorixonachi")
@RequiredArgsConstructor
public class DorixonachiController {

    private final DorixonaRepository dorixonaRepository;
    private final BronRepository bronRepository;
    private final DoriService doriService;

    /** Foydalanuvchi dorixona egasimi — egasi bo'lsa dorixona ma'lumotlarini qaytaradi. */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> check(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.ok(Map.of("egasi", false));
        Dorixona dx = dorixonaRepository.findByEgasiTelegramId(user.getId());
        if (dx == null) return ResponseEntity.ok(Map.of("egasi", false));
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("egasi", true);
        map.put("dorixona", dx);
        return ResponseEntity.ok(map);
    }

    /** Dorixonadagi dorilar ro'yxati. */
    @GetMapping("/dorilar")
    public ResponseEntity<?> dorilar(@AuthenticationPrincipal User user) {
        Dorixona dx = ownPharmacy(user);
        if (dx == null) return forbidden();
        return ResponseEntity.ok(doriService.dorixonaDorilari(dx.getId()));
    }

    /** Yangi dori qo'shish. */
    @PostMapping("/dori")
    public ResponseEntity<?> doriQoshish(@AuthenticationPrincipal User user, @RequestBody Dori dori) {
        Dorixona dx = ownPharmacy(user);
        if (dx == null) return forbidden();
        dori.setDorixonaId(dx.getId());
        return ResponseEntity.ok(doriService.doriQoshish(dori));
    }

    /** Dorini yangilash (narx, mavjudlik). */
    @PutMapping("/dori/{id}")
    public ResponseEntity<?> doriYangilash(@AuthenticationPrincipal User user,
                                            @PathVariable Long id, @RequestBody Dori dori) {
        Dorixona dx = ownPharmacy(user);
        if (dx == null) return forbidden();
        return ResponseEntity.ok(doriService.doriYangilash(id, dori));
    }

    /** Dorini o'chirish. */
    @DeleteMapping("/dori/{id}")
    public ResponseEntity<?> doriOchirish(@AuthenticationPrincipal User user, @PathVariable Long id) {
        Dorixona dx = ownPharmacy(user);
        if (dx == null) return forbidden();
        doriService.doriOchirish(id);
        return ResponseEntity.noContent().build();
    }

    /** Excel fayldan dorilarni import qilish (eski dorilar saqlanadi). */
    @PostMapping("/dori/import")
    public ResponseEntity<?> excelImport(@AuthenticationPrincipal User user,
                                          @RequestParam("file") MultipartFile file) {
        Dorixona dx = ownPharmacy(user);
        if (dx == null) return forbidden();
        try {
            int soni = doriService.excelImportQoshish(dx.getId(), file);
            return ResponseEntity.ok(Map.of("ok", true, "soni", soni));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "xato", e.getMessage()));
        }
    }

    /** Dorixonaga kelgan bronlar ro'yxati. */
    @GetMapping("/bronlar")
    public ResponseEntity<?> bronlar(@AuthenticationPrincipal User user) {
        Dorixona dx = ownPharmacy(user);
        if (dx == null) return forbidden();
        List<BronRepository.DorixonaBronQator> list = bronRepository.dorixonaniki(dx.getId());
        return ResponseEntity.ok(list.stream().map(b -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", b.getId());
            m.put("doriNomi", b.getDoriNomi());
            m.put("narx", b.getNarx());
            m.put("mijozIsmi", b.getMijozIsmi());
            m.put("mijozTelefon", b.getMijozTelefon());
            m.put("soni", b.getSoni());
            m.put("tur", b.getTur());
            m.put("kod", b.getKod());
            m.put("holat", b.getHolat());
            m.put("sana", b.getSana() == null ? null : b.getSana().toString());
            return m;
        }).toList());
    }

    /** Bron holatini o'zgartirish (TAYYOR, BERILDI, BEKOR). */
    @PostMapping("/bron/{id}/holat")
    public ResponseEntity<?> bronHolat(@AuthenticationPrincipal User user,
                                        @PathVariable Long id,
                                        @RequestBody Map<String, String> body) {
        Dorixona dx = ownPharmacy(user);
        if (dx == null) return forbidden();
        String yangiHolat = body.get("holat");
        if (yangiHolat == null) return ResponseEntity.badRequest().body(Map.of("xato", "holat kerak"));
        return bronRepository.findById(id)
                .filter(b -> b.getDorixonaId().equals(dx.getId()))
                .map(b -> {
                    b.setHolat(yangiHolat);
                    bronRepository.save(b);
                    return ResponseEntity.ok(Map.of("ok", true, "holat", yangiHolat));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /** Dorixona ma'lumotlarini yangilash. */
    @PutMapping("/malumot")
    public ResponseEntity<?> malumotYangilash(@AuthenticationPrincipal User user,
                                               @RequestBody Dorixona yangi) {
        Dorixona dx = ownPharmacy(user);
        if (dx == null) return forbidden();
        if (yangi.getName() != null) dx.setName(yangi.getName());
        if (yangi.getAddress() != null) dx.setAddress(yangi.getAddress());
        if (yangi.getTelefon() != null) dx.setTelefon(yangi.getTelefon());
        if (yangi.getIshBoshlanishi() != null) dx.setIshBoshlanishi(yangi.getIshBoshlanishi());
        if (yangi.getIshTugashi() != null) dx.setIshTugashi(yangi.getIshTugashi());
        return ResponseEntity.ok(dorixonaRepository.save(dx));
    }

    private Dorixona ownPharmacy(User user) {
        if (user == null) return null;
        return dorixonaRepository.findByEgasiTelegramId(user.getId());
    }

    private ResponseEntity<Map<String, Object>> forbidden() {
        return ResponseEntity.status(403).body(Map.of("xato", "Sizda dorixona yo'q"));
    }
}
