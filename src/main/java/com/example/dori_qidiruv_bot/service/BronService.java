package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.entity.Bron;
import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.entity.Dorixona;
import com.example.dori_qidiruv_bot.entity.User;
import com.example.dori_qidiruv_bot.repository.BronRepository;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Saytdan bron qilish. Bron umumiy `bron` jadvaliga yoziladi — xuddi mijozlar boti
 * yozgani kabi. Shuning uchun dorixona egasiga xabar dorixonalar boti orqali boradi
 * va uning javobi mijozga qaytadi: sayt bu zanjirga qo'shimcha hech narsa talab qilmaydi.
 */
@Service
@RequiredArgsConstructor
public class BronService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final BronRepository bronRepository;
    private final DoriRepository doriRepository;
    private final DorixonaRepository dorixonaRepository;
    private final OmborService omborService;

    /** Bron yaratadi va olib ketish kodini qaytaradi. */
    @Transactional
    public Map<String, Object> bronQil(User mijoz, Long doriId, int soni, String tur) {
        if (soni <= 0) throw new IllegalArgumentException("Son musbat bo'lishi kerak");

        Dori dori = doriRepository.findById(doriId)
                .orElseThrow(() -> new IllegalArgumentException("Bunday mahsulot topilmadi"));

        // Ombor hisobi yuritilayotgan bo'lsa, qoldiqdan ko'p bron qilib bo'lmaydi —
        // aks holda dorixona bajara olmaydigan buyurtma tushardi.
        long qoldiq = omborService.qoldiq(doriId);
        Map<Long, long[]> qoldiqlar = omborService.qoldiqlar();
        boolean hisobYuritiladi = qoldiqlar.containsKey(doriId) && qoldiqlar.get(doriId)[1] > 0;
        if (hisobYuritiladi && soni > qoldiq) {
            throw new IllegalStateException("Omborda faqat " + qoldiq + " ta bor");
        }
        if (hisobYuritiladi && qoldiq <= 0) {
            throw new IllegalStateException("Mahsulot tugagan");
        }

        Bron bron = new Bron();
        bron.setDoriId(doriId);
        bron.setDorixonaId(dori.getDorixonaId());
        bron.setMijozTelegramId(mijoz.getId());
        bron.setMijozIsmi(mijoz.getName());
        bron.setMijozTelefon(mijoz.getPhoneNumber());
        bron.setSoni(soni);
        bron.setTur(tur != null ? tur : Bron.DONA);
        bron.setKod(kodYarat());
        bron.setHolat(Bron.YANGI);
        bron.setEgagaXabar(false);
        bron.setMijozgaXabar(true);
        bron.setSana(LocalDateTime.now());

        Double narx = Bron.PACHKA.equals(bron.getTur()) ? dori.getPachkaNarx() : dori.getPrice();
        if (narx == null) narx = dori.getPrice();
        double jami = (narx != null ? narx : 0) * soni;
        bron.setTolovSummasi(0.0);
        bron.setOlibKetishMuddati(LocalDateTime.now().plusDays(2));

        bronRepository.save(bron);

        Dorixona dorixona = dorixonaRepository.findById(dori.getDorixonaId()).orElse(null);

        Map<String, Object> javob = new LinkedHashMap<>();
        javob.put("id", bron.getId());
        javob.put("kod", bron.getKod());
        javob.put("soni", soni);
        javob.put("tur", bron.getTur());
        javob.put("doriNomi", dori.getName());
        javob.put("narx", narx);
        javob.put("jami", jami);
        javob.put("tolovSummasi", 0.0);
        javob.put("dorixonaNomi", dorixona == null ? null : dorixona.getName());
        javob.put("manzil", dorixona == null ? null : dorixona.getAddress());
        javob.put("telefon", dorixona == null ? null : dorixona.getTelefon());
        javob.put("kartaRaqami", dorixona == null ? null : dorixona.getKartaRaqami());
        return javob;
    }

    /** Mijozning bronlari — holati va olib ketish kodi bilan. */
    public List<Map<String, Object>> meningBronlarim(User mijoz) {
        return bronRepository.mijozniki(mijoz.getId()).stream()
                .map(q -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", q.getId());
                    m.put("doriNomi", q.getDoriNomi());
                    m.put("narx", q.getNarx());
                    m.put("dorixonaNomi", q.getDorixonaNomi());
                    m.put("manzil", q.getManzil());
                    m.put("telefon", q.getTelefon());
                    m.put("soni", q.getSoni());
                    m.put("tur", q.getTur());
                    m.put("kod", q.getKod());
                    m.put("holat", q.getHolat());
                    m.put("tolovSummasi", q.getTolovSummasi());
                    m.put("tolovHolati", q.getTolovHolati());
                    m.put("olibKetishMuddati", q.getOlibKetishMuddati() == null ? null : q.getOlibKetishMuddati().toString());
                    m.put("sana", q.getSana() == null ? null : q.getSana().toString());
                    return m;
                })
                .toList();
    }

    @Transactional
    public Map<String, Object> chekYuklash(User mijoz, Long bronId, byte[] chekRasmi) {
        Bron bron = bronRepository.findById(bronId)
                .orElseThrow(() -> new IllegalArgumentException("Bron topilmadi"));

        if (!bron.getMijozTelegramId().equals(mijoz.getId())) {
            throw new IllegalArgumentException("Bu bron sizga tegishli emas");
        }
        if (!"KUTILMOQDA".equals(bron.getTolovHolati())) {
            throw new IllegalStateException("Bu bron uchun to'lov allaqachon amalga oshgan yoki bekor qilingan");
        }

        bron.setTolovCheki(chekRasmi);
        bron.setTolovHolati("TEKSHIRILMOQDA");
        bron.setHolat(Bron.YANGI);
        bron.setEgagaXabar(false);
        bronRepository.save(bron);

        Map<String, Object> javob = new LinkedHashMap<>();
        javob.put("id", bron.getId());
        javob.put("holat", "TEKSHIRILMOQDA");
        javob.put("xabar", "To'lov cheki yuklandi. Dorixona tekshirib tasdiqlagandan keyin bron faollashadi.");
        return javob;
    }

    @Transactional
    public int muddatiOtganlarniBekorQil() {
        List<Bron> otganlar = bronRepository.muddatiOtganlar(LocalDateTime.now());
        for (Bron bron : otganlar) {
            bron.setHolat(Bron.MUDDATI_OTGAN);
            bron.setTolovHolati("QAYTARILMAYDI");
            bron.setEgagaXabar(false);
            bron.setMijozgaXabar(false);
        }
        bronRepository.saveAll(otganlar);
        return otganlar.size();
    }

    public byte[] chekOlish(Long bronId) {
        Bron bron = bronRepository.findById(bronId)
                .orElseThrow(() -> new IllegalArgumentException("Bron topilmadi"));
        return bron.getTolovCheki();
    }

    private String kodYarat() {
        return String.valueOf(100000 + RANDOM.nextInt(900000));
    }
}
