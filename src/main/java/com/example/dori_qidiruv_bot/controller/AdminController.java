package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import com.example.dori_qidiruv_bot.repository.UserRepository;
import com.example.dori_qidiruv_bot.service.OmborService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    private final OmborService omborService;

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

    /** Dorixona bo'yicha ombor hisoboti: nima kelgan, nima sotilgan, nima qolgan. */
    @GetMapping("/ombor/hisobot/{dorixonaId}")
    public ResponseEntity<Map<String, Object>> hisobot(@PathVariable Long dorixonaId) {
        return ResponseEntity.ok(omborService.hisobot(dorixonaId));
    }

    /** Butun tizim bo'yicha jami kirim / chiqim / qoldiq / tushum. */
    @GetMapping("/ombor/umumiy")
    public ResponseEntity<Map<String, Object>> omborUmumiy() {
        return ResponseEntity.ok(omborService.umumiy());
    }

    /** Kirim: dorixonaga mahsulot keldi. */
    @PostMapping("/ombor/kirim")
    public ResponseEntity<Map<String, Object>> kirim(@RequestBody HarakatRequest so_rov) {
        omborService.kirim(so_rov.doriId(), so_rov.soni(), so_rov.narx(), so_rov.izoh());
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "qoldiq", omborService.qoldiq(so_rov.doriId())
        ));
    }

    /** Chiqim: mahsulot sotildi. Qoldiq yetmasa 409 qaytadi va hech narsa yozilmaydi. */
    @PostMapping("/ombor/chiqim")
    public ResponseEntity<Map<String, Object>> chiqim(@RequestBody HarakatRequest so_rov) {
        boolean yozildi = omborService.chiqim(so_rov.doriId(), so_rov.soni(), so_rov.narx(), so_rov.izoh());
        long qoldiq = omborService.qoldiq(so_rov.doriId());
        if (!yozildi) {
            return ResponseEntity.status(409).body(Map.of(
                    "ok", false,
                    "xato", "Omborda yetarli mahsulot yo'q",
                    "qoldiq", qoldiq
            ));
        }
        return ResponseEntity.ok(Map.of("ok", true, "qoldiq", qoldiq));
    }

    /** Kirim/chiqim so'rovi tanasi. narx va izoh ixtiyoriy. */
    public record HarakatRequest(Long doriId, int soni, Double narx, String izoh) { }
}
