package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.entity.OmborHarakat;
import com.example.dori_qidiruv_bot.repository.OmborRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Ombor hisobi: kirim (mahsulot keldi), chiqim (sotildi) va hisobotlar. */
@Service
@RequiredArgsConstructor
public class OmborService {

    private final OmborRepository omborRepository;

    /** Kirim yozadi. Son musbat bo'lishi shart. */
    @Transactional
    public void kirim(Long doriId, int soni, Double narx, String izoh) {
        if (soni <= 0) throw new IllegalArgumentException("Son musbat bo'lishi kerak");
        OmborHarakat harakat = new OmborHarakat();
        harakat.setDoriId(doriId);
        harakat.setTuri(OmborHarakat.KIRIM);
        harakat.setSoni(soni);
        harakat.setNarx(narx);
        harakat.setIzoh(izoh);
        harakat.setSana(LocalDateTime.now());
        omborRepository.save(harakat);
    }

    /**
     * Chiqim (sotuv) yozadi. Qoldiqdan ko'p sotib bo'lmaydi — bazaning o'zi rad etadi.
     * Qoldiq yetmasa false qaytadi va hech narsa yozilmaydi.
     */
    @Transactional
    public boolean chiqim(Long doriId, int soni, Double narx, String izoh) {
        if (soni <= 0) throw new IllegalArgumentException("Son musbat bo'lishi kerak");
        return omborRepository.chiqimYoz(doriId, soni, narx, izoh) > 0;
    }

    public long qoldiq(Long doriId) {
        return omborRepository.qoldiq(doriId);
    }

    /**
     * Dorixona bo'yicha hisobot: mahsulotlar ro'yxati va yakuniy jamlanma.
     * Qoldiq har bir satrda kelgan minus sotilgan sifatida hisoblanadi.
     */
    public Map<String, Object> hisobot(Long dorixonaId) {
        List<OmborRepository.Satr> satrlar = omborRepository.hisobot(dorixonaId);

        List<Map<String, Object>> mahsulotlar = new java.util.ArrayList<>();
        long jamiKelgan = 0;
        long jamiSotilgan = 0;
        double jamiTushum = 0;
        double omborQiymati = 0;

        for (OmborRepository.Satr satr : satrlar) {
            long kelgan = satr.getKelgan() == null ? 0 : satr.getKelgan();
            long sotilgan = satr.getSotilgan() == null ? 0 : satr.getSotilgan();
            double narx = satr.getNarx() == null ? 0 : satr.getNarx();
            double tushum = satr.getTushum() == null ? 0 : satr.getTushum();
            long qoldiq = kelgan - sotilgan;

            Map<String, Object> qator = new LinkedHashMap<>();
            qator.put("doriId", satr.getDoriId());
            qator.put("nomi", satr.getNomi());
            qator.put("narx", narx);
            qator.put("kelgan", kelgan);
            qator.put("sotilgan", sotilgan);
            qator.put("qoldiq", qoldiq);
            qator.put("tushum", tushum);
            qator.put("hisobYuritiladi", kelgan > 0);
            mahsulotlar.add(qator);

            jamiKelgan += kelgan;
            jamiSotilgan += sotilgan;
            jamiTushum += tushum;
            omborQiymati += qoldiq * narx;
        }

        Map<String, Object> natija = new LinkedHashMap<>();
        natija.put("mahsulotlar", mahsulotlar);
        natija.put("turlarSoni", mahsulotlar.size());
        natija.put("jamiKelgan", jamiKelgan);
        natija.put("jamiSotilgan", jamiSotilgan);
        natija.put("jamiQoldiq", jamiKelgan - jamiSotilgan);
        natija.put("jamiTushum", jamiTushum);
        natija.put("omborQiymati", omborQiymati);
        return natija;
    }

    /** Butun tizim bo'yicha jami kelgan / sotilgan / qoldiq / tushum. */
    public Map<String, Object> umumiy() {
        OmborRepository.Umumiy u = omborRepository.umumiy();
        long kelgan = u == null || u.getKelgan() == null ? 0 : u.getKelgan();
        long sotilgan = u == null || u.getSotilgan() == null ? 0 : u.getSotilgan();
        double tushum = u == null || u.getTushum() == null ? 0 : u.getTushum();

        Map<String, Object> natija = new LinkedHashMap<>();
        natija.put("jamiKelgan", kelgan);
        natija.put("jamiSotilgan", sotilgan);
        natija.put("jamiQoldiq", kelgan - sotilgan);
        natija.put("jamiTushum", tushum);
        return natija;
    }

    /**
     * Barcha mahsulotlarning qoldig'i: dori id -> [qoldiq, kelgan].
     * Ro'yxatlarda qoldiqni ko'rsatish uchun bitta so'rovda olinadi.
     */
    public Map<Long, long[]> qoldiqlar() {
        Map<Long, long[]> map = new HashMap<>();
        for (OmborRepository.Qoldiq q : omborRepository.barchaQoldiqlar()) {
            if (q.getDoriId() == null) continue;
            long qoldiq = q.getQoldiq() == null ? 0 : q.getQoldiq();
            long kelgan = q.getKelgan() == null ? 0 : q.getKelgan();
            map.put(q.getDoriId(), new long[] { qoldiq, kelgan });
        }
        return map;
    }
}
