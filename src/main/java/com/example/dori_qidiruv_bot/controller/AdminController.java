package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.repository.DoriKatalogRepository;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import com.example.dori_qidiruv_bot.repository.SoovRepository;
import com.example.dori_qidiruv_bot.repository.UserRepository;
import com.example.dori_qidiruv_bot.service.DoriService;
import com.example.dori_qidiruv_bot.service.OmborService;
import com.example.dori_qidiruv_bot.service.PanelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
    private final DoriService doriService;
    private final PanelService panelService;
    private final com.example.dori_qidiruv_bot.service.FaylImport faylImport;

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

    /** Umumiy statistika — botdagi "📊 Statistika" ko'rsatkichlari bilan. */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(panelService.statistika());
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

    // ——— Dorixonalar (botdagi "➕ Dorixona qo'shish", "📋 Dorixonalar", "🔄 Uzaytirish", "🗑 O'chirish") ———

    @GetMapping("/dorixonalar")
    public ResponseEntity<List<Map<String, Object>>> dorixonalar() {
        return ResponseEntity.ok(panelService.dorixonalar());
    }

    @PostMapping("/dorixona")
    public ResponseEntity<Map<String, Object>> dorixonaQosh(@RequestBody Map<String, String> b) {
        String nomi = b.get("nomi");
        if (nomi == null || nomi.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "xato", "Dorixona nomi kerak"));
        }
        int oylar = parseInt(b.get("oylar"));
        long id = panelService.dorixonaQosh(nomi.trim(), b.get("viloyat"), b.get("tuman"), b.get("manzil"),
                b.get("telefon"), b.get("ishBoshlanishi"), b.get("ishTugashi"), oylar,
                PanelService.koordinata(b.get("latitude"), 90), PanelService.koordinata(b.get("longitude"), 180));
        return ResponseEntity.ok(Map.of("ok", true, "id", id));
    }

    @PutMapping("/dorixona/{id}")
    public ResponseEntity<Map<String, Object>> dorixonaYangila(@PathVariable Long id, @RequestBody Map<String, String> b) {
        return panelService.dorixonaYangila(id, b)
                ? ResponseEntity.ok(Map.of("ok", true))
                : ResponseEntity.notFound().build();
    }

    @PostMapping("/dorixona/{id}/uzaytir")
    public ResponseEntity<Map<String, Object>> uzaytir(@PathVariable Long id, @RequestBody Map<String, String> b) {
        int oylar = parseInt(b.get("oylar"));
        if (oylar <= 0 || oylar > 36) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "xato", "Oy soni 1 dan 36 gacha bo'lsin"));
        }
        java.time.LocalDate yangi = panelService.obunaUzaytir(id, oylar);
        return yangi == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(Map.of("ok", true, "tugash", yangi.toString()));
    }

    @DeleteMapping("/dorixona/{id}")
    public ResponseEntity<Map<String, Object>> dorixonaOchir(@PathVariable Long id) {
        return panelService.dorixonaOchir(id)
                ? ResponseEntity.ok(Map.of("ok", true))
                : ResponseEntity.notFound().build();
    }

    // ——— Dorixonaning mahsulotlari (botdagi "➕ Dori qo'shish", "✏️ Narx tahrirlash", "🗑 Dori o'chirish") ———

    @GetMapping("/dorixona/{id}/dorilar")
    public ResponseEntity<?> dorixonaDorilari(@PathVariable Long id) {
        return ResponseEntity.ok(doriService.dorixonaDorilari(id));
    }

    @PostMapping("/dorixona/{id}/dori")
    public ResponseEntity<?> doriQosh(@PathVariable Long id, @RequestBody com.example.dori_qidiruv_bot.entity.Dori dori) {
        if (dori.getName() == null || dori.getName().isBlank() || dori.getPrice() == null) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "xato", "Nomi va narxi kerak"));
        }
        dori.setId(null);
        dori.setDorixonaId(id);
        if (dori.getAvailable() == null) dori.setAvailable(true);
        return ResponseEntity.ok(doriService.doriQoshish(dori));
    }

    @PutMapping("/dori/{id}")
    public ResponseEntity<?> doriYangila(@PathVariable Long id, @RequestBody com.example.dori_qidiruv_bot.entity.Dori dori) {
        dori.setDorixonaId(null);
        return ResponseEntity.ok(doriService.doriYangilash(id, dori));
    }

    @DeleteMapping("/dori/{id}")
    public ResponseEntity<Map<String, Object>> doriOchir(@PathVariable Long id) {
        return panelService.doriOchir(id, null)
                ? ResponseEntity.ok(Map.of("ok", true))
                : ResponseEntity.notFound().build();
    }

    // ——— Buyurtmalar (botdagi "🔔 Buyurtmalar") ———

    @GetMapping("/bronlar")
    public ResponseEntity<List<Map<String, Object>>> bronlar() {
        return ResponseEntity.ok(panelService.barchaBronlar());
    }

    private static int parseInt(String s) {
        try { return s == null ? 0 : Integer.parseInt(s.trim()); } catch (NumberFormatException e) { return 0; }
    }

    /** Excel fayldan dorilarni yangilash — eski dorilarni O'CHIRIB, yangilarini kiritadi. */
    @PostMapping("/dori/import/{dorixonaId}")
    public ResponseEntity<Map<String, Object>> excelImport(
            @PathVariable Long dorixonaId,
            @RequestParam("file") MultipartFile file) {
        try {
            int soni = doriService.excelImportYangilash(dorixonaId, file);
            return ResponseEntity.ok(Map.of("ok", true, "soni", soni));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "xato", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("ok", false,
                    "xato", "Excel faylni o'qib bo'lmadi: " + e.getMessage()));
        }
    }

    /** Excel fayldan yangi dorilar QO'SHISH — eski dorilar saqlanib qoladi. */
    @PostMapping("/dori/qoshish-import/{dorixonaId}")
    public ResponseEntity<Map<String, Object>> excelQoshish(
            @PathVariable Long dorixonaId,
            @RequestParam("file") MultipartFile file) {
        try {
            var n = faylImport.qosh(dorixonaId, file.getBytes());
            return ResponseEntity.ok(Map.of("ok", true, "soni", n.qoshildi(), "dublikat", n.dublikat(), "otkazildi", n.otkazildi()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("ok", false, "xato", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("ok", false,
                    "xato", "Excel faylni o'qib bo'lmadi: " + e.getMessage()));
        }
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
