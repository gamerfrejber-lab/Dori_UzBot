package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.dto.DoriQidiruvResponse;
import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.entity.DoriKatalog;
import com.example.dori_qidiruv_bot.entity.Dorixona;
import com.example.dori_qidiruv_bot.repository.DoriKatalogRepository;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoriService {
    private final DoriRepository doriRepository;
    private final DorixonaRepository dorixonaRepository;
    private final DoriKatalogRepository katalogRepository;
    private final OmborService omborService;

    /**
     * Katalogdan (butun O'zbekiston ro'yxati) qidirish — dori qo'shishda tanlash uchun.
     * Natijalar soni cheklanadi (avtomatik to'ldirish ro'yxati juda uzun bo'lib ketmasligi uchun).
     */
    public List<DoriKatalog> katalogQidirish(String q, int limit) {
        if (q == null || q.trim().length() < 2) {
            return List.of();
        }
        int chegara = Math.max(1, Math.min(limit, 50));
        return katalogRepository.qidirish(q.trim(), PageRequest.of(0, chegara));
    }

    public List<DoriQidiruvResponse> qidirish(String nomi) {
        List<Dori> dorilar = doriRepository.findByNameContainingIgnoreCase(nomi);
        // Qoldiqlar bitta so'rovda olinadi — har bir dori uchun alohida so'rov yubormaslik uchun.
        Map<Long, long[]> qoldiqlar = omborService.qoldiqlar();

        return dorilar.stream()
                .map(dori -> {
                    Dorixona dorixona = dorixonaRepository.findById(dori.getDorixonaId())
                            .orElse(null);
                    long[] ombor = qoldiqlar.getOrDefault(dori.getId(), new long[] { 0, 0 });
                    return new DoriQidiruvResponse(
                            dori.getId(),
                            dori.getName(),
                            dori.getNameRu(),
                            dori.getManufacturer(),
                            dori.getPrice(),
                            dori.getPachkaNarx(),
                            dori.getPachkadagiDona(),
                            dori.getAvailable(),
                            dorixona,
                            ombor[0],
                            ombor[1] > 0
                    );
                })
                .collect(Collectors.toList());
    }

    /** Dorixonadagi mahsulotlar, har birida ombor qoldig'i bilan. */
    public List<Dori> dorixonaDorilari(Long dorixonaId) {
        List<Dori> dorilar = doriRepository.findByDorixonaIdOrderByNameAsc(dorixonaId);
        Map<Long, long[]> qoldiqlar = omborService.qoldiqlar();
        for (Dori dori : dorilar) {
            long[] ombor = qoldiqlar.getOrDefault(dori.getId(), new long[] { 0, 0 });
            dori.setQoldiq(ombor[0]);
            dori.setHisobYuritiladi(ombor[1] > 0);
        }
        return dorilar;
    }

    public Dori doriQoshish(Dori dori) {
        return doriRepository.save(dori);
    }

    /**
     * Mavjud dorini xavfsiz yangilaydi: bazadan yuklab, faqat kelgan (null bo'lmagan)
     * maydonlarni o'zgartiradi. Shu tariqa narxni tahrirlaganda nom, firma yoki dorixona
     * bog'lanishi o'chib ketmaydi.
     */
    public Dori doriYangilash(Long id, Dori yangi) {
        Dori mavjud = doriRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dori topilmadi: " + id));
        if (yangi.getName() != null) mavjud.setName(yangi.getName());
        if (yangi.getNameRu() != null) mavjud.setNameRu(yangi.getNameRu());
        if (yangi.getManufacturer() != null) mavjud.setManufacturer(yangi.getManufacturer());
        if (yangi.getPrice() != null) mavjud.setPrice(yangi.getPrice());
        if (yangi.getPachkaNarx() != null) mavjud.setPachkaNarx(yangi.getPachkaNarx());
        if (yangi.getPachkadagiDona() != null) mavjud.setPachkadagiDona(yangi.getPachkadagiDona());
        if (yangi.getAvailable() != null) mavjud.setAvailable(yangi.getAvailable());
        if (yangi.getDorixonaId() != null) mavjud.setDorixonaId(yangi.getDorixonaId());
        return doriRepository.save(mavjud);
    }

    public List<Dori> barchaDorilar() {
        return doriRepository.findAll();
    }

    public void doriOchirish(Long id) {
        doriRepository.deleteById(id);
    }
}
