package com.example.dori_qidiruv_bot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Dorilarga kategoriya yozadi. Dorilar bazaga bot orqali ham tushadi, shuning uchun
 * import paytida emas, shu yerda — sayt tomonida belgilanadi.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KategoriyaBelgilovchi {

    private final JdbcTemplate jdbc;
    private final KategoriyaAniqlovchi aniqlovchi;
    private final NomTozalovchi nomTozalovchi;

    /** Ishga tushganda hammasi qayta hisoblanadi — qoidalar o'zgargan bo'lsa eski belgilar yangilanadi. */
    @EventListener(ApplicationReadyEvent.class)
    public void hammasiniQaytaBelgila() {
        nomTozalovchi.tozala();
        belgila("SELECT id, nomi, nomi_ru, kategoriya FROM dori");
    }

    /** Yangi qo'shilgan (hali belgilanmagan) dorilar: avval nomi tozalanadi, keyin kategoriya belgilanadi. */
    @Scheduled(initialDelay = 120_000, fixedDelay = 120_000)
    public void yangilarniBelgila() {
        nomTozalovchi.tozala();
        belgila("SELECT id, nomi, nomi_ru, kategoriya FROM dori WHERE kategoriya IS NULL");
    }

    private void belgila(String sql) {
        try {
            List<Object[]> yangilanadi = new ArrayList<>();
            for (Map<String, Object> qator : jdbc.queryForList(sql)) {
                String yangi = aniqlovchi.aniqla((String) qator.get("nomi"), (String) qator.get("nomi_ru"));
                if (!yangi.equals(qator.get("kategoriya"))) {
                    yangilanadi.add(new Object[]{yangi, qator.get("id")});
                }
            }
            if (yangilanadi.isEmpty()) return;
            jdbc.batchUpdate("UPDATE dori SET kategoriya = ? WHERE id = ?", yangilanadi);
            log.info("{} ta doriga kategoriya belgilandi.", yangilanadi.size());
        } catch (Exception e) {
            log.warn("Kategoriyalarni belgilab bo'lmadi: {}", e.getMessage());
        }
    }
}
