package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.dto.DoriQidiruvResponse;
import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.entity.Dorixona;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoriService {
    private final DoriRepository doriRepository;
    private final DorixonaRepository dorixonaRepository;
    private final OmborService omborService;

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
                            dori.getPriceDona(),
                            dori.getPricePachka(),
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

    public List<Dori> barchaDorilar() {
        return doriRepository.findAll();
    }

    public void doriOchirish(Long id) {
        doriRepository.deleteById(id);
    }
}
