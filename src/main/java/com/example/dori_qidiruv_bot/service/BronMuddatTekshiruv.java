package com.example.dori_qidiruv_bot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BronMuddatTekshiruv {

    private final BronService bronService;

    @Scheduled(fixedRate = 3600000)
    public void muddatiOtganlarniTekshir() {
        int soni = bronService.muddatiOtganlarniBekorQil();
        if (soni > 0) {
            log.info("Muddati o'tgan {} ta bron bekor qilindi", soni);
        }
    }
}
