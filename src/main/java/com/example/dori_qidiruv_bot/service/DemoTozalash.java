package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.entity.Dorixona;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DemoTozalash implements CommandLineRunner {

    private final DorixonaRepository dorixonaRepository;
    private final DoriRepository doriRepository;

    private static final Set<String> SAQLANADIGAN = Set.of("Vazira farm");

    @Override
    @Transactional
    public void run(String... args) {
        List<Dorixona> hammasi = dorixonaRepository.findAll();
        List<Dorixona> ochiriladiganlar = hammasi.stream()
                .filter(dx -> !SAQLANADIGAN.contains(dx.getName()))
                .toList();

        if (ochiriladiganlar.isEmpty()) {
            log.info("Demo dorixonalar allaqachon tozalangan.");
            return;
        }

        for (Dorixona dx : ochiriladiganlar) {
            log.info("O'chirilmoqda: {} (id={})", dx.getName(), dx.getId());
            doriRepository.deleteByDorixonaId(dx.getId());
            dorixonaRepository.deleteById(dx.getId());
        }
        log.info("{} ta demo dorixona o'chirildi.", ochiriladiganlar.size());
    }
}
