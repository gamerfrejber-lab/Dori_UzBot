package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.repository.DoriKatalogRepository;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import com.example.dori_qidiruv_bot.repository.SoovRepository;
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
    private final DoriKatalogRepository katalogRepository;
    private final OmborService omborService;
    private final SoovRepository soovRepository;

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

    /** Umumiy statistika: foydalanuvchi, dorixona, dori va katalog soni. */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> stats() {
        return ResponseEntity.ok(Map.of(
                "users", userRepository.count(),
                "pharmacies", dorixonaRepository.count(),
                "drugs", doriRepository.count(),
                "katalog", katalogRepository.count()
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

    // ——— Dorixona egaligi arizalari (botdagi "Arizalar" bo'limi bilan bir xil) ———

    /** Ko'rib chiqilmagan arizalar ro'yxati. */
    @GetMapping("/soov")
    public ResponseEntity<List<Map<String, Object>>> arizalar() {
        return ResponseEntity.ok(soovRepository.kutilayotganlar().stream()
                .map(q -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<String, Object>();
                    m.put("id", q.getId());
                    m.put("dorixonaId", q.getDorixonaId());
                    m.put("dorixonaNomi", q.getDorixonaNomi());
                    m.put("telegramId", q.getTelegramId());
                    m.put("ism", q.getIsm());
                    m.put("username", q.getUsername());
                    m.put("telefon", q.getTelefon());
                    m.put("tekshiruvKodi", q.getTekshiruvKodi());
                    m.put("sana", q.getSana() == null ? null : q.getSana().toString());
                    return m;
                })
                .toList());
    }

    /**
     * Dalil surati. Rasm bazadan baytlar bilan olinadi — Telegram bergan file_id faqat
     * uni yuklagan botda ishlagani uchun saytda ko'rsatib bo'lmaydi.
     * turi: "litsenziya" yoki "jonli".
     */
    @GetMapping("/soov/{id}/rasm/{turi}")
    public ResponseEntity<byte[]> arizaRasmi(@PathVariable Long id, @PathVariable String turi) {
        byte[] rasm = "jonli".equals(turi) ? soovRepository.jonliRasm(id) : soovRepository.litsenziyaRasm(id);
        if (rasm == null || rasm.length == 0) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .header("Content-Type", "image/jpeg")
                .header("Cache-Control", "private, max-age=3600")
                .body(rasm);
    }

    /** Arizani tasdiqlash yoki rad etish. */
    @PostMapping("/soov/{id}/{qaror}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<Map<String, Object>> arizaQarori(@PathVariable Long id, @PathVariable String qaror) {
        boolean tasdiq = "tasdiq".equals(qaror);
        List<SoovRepository.Qator> kutilmoqda = soovRepository.kutilayotganlar();
        SoovRepository.Qator ariza = kutilmoqda.stream()
                .filter(q -> q.getId().equals(id)).findFirst().orElse(null);
        if (ariza == null) {
            return ResponseEntity.status(409).body(Map.of("ok", false, "xato", "Ariza topilmadi yoki allaqachon hal qilingan"));
        }
        if (soovRepository.hal(id, tasdiq ? SoovRepository.TASDIQLANGAN : SoovRepository.RAD) == 0) {
            return ResponseEntity.status(409).body(Map.of("ok", false, "xato", "Ariza allaqachon hal qilingan"));
        }
        if (tasdiq && soovRepository.egasiniBiriktir(ariza.getDorixonaId(), ariza.getTelegramId()) == 0) {
            return ResponseEntity.ok(Map.of("ok", true,
                    "ogohlantirish", "Bu dorixona allaqachon boshqa egaga biriktirilgan"));
        }
        return ResponseEntity.ok(Map.of("ok", true, "tasdiq", tasdiq));
    }
}
