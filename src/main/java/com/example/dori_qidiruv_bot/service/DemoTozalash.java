package com.example.dori_qidiruv_bot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Bot yangi (bo'sh) bazaga yozib qo'ygan namuna dorixonalarni va ularning dorilarini o'chiradi.
 * Faqat nomi HAM, soxta telefoni HAM namuna ro'yxatiga to'g'ri kelgan yozuvlarga tegadi.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(200)
public class DemoTozalash implements CommandLineRunner {

    private static final List<String> NAMUNA_NOMLAR = List.of(
            "Yunusobod Apteka", "Chilonzor Shifo", "Sergeli Farm", "Mirzo Ulug'bek Dori", "Olmazor Med",
            "Shayxontohur Apteka", "Yakkasaroy Farm", "Mirobod Dori", "Bektemir Apteka", "Uchtepa Shifo",
            "Yashnobod Farm", "Mirobod 24/7", "Chorsu Dori", "Tinchlik Apteka", "Novza Farm",
            "Qo'yliq Shifo", "Bodomzor Apteka", "Minor Dori", "Parkent Farm", "Qatortol Apteka");

    private final JdbcTemplate jdbc;

    @Override
    public void run(String... args) {
        try {
            String nomlar = NAMUNA_NOMLAR.stream().map(n -> "?").collect(Collectors.joining(","));
            String shart = "nomi IN (" + nomlar + ") AND telefon LIKE '+9989011122__'";
            Object[] params = NAMUNA_NOMLAR.toArray();

            List<Long> idlar = jdbc.queryForList("SELECT id FROM dorixona WHERE " + shart, Long.class, params);
            if (idlar.isEmpty()) return;

            // Jadval butunlay bo'shab qolsa bot namunalarni qayta yozadi — haqiqiy dorixona bo'lsagina tozalaymiz.
            Integer jami = jdbc.queryForObject("SELECT count(*) FROM dorixona", Integer.class);
            if (jami == null || jami <= idlar.size()) {
                log.warn("Namuna dorixonalar o'chirilmadi: bazada haqiqiy dorixona yo'q.");
                return;
            }

            String idRoyxat = idlar.stream().map(String::valueOf).collect(Collectors.joining(","));
            int dorilar = jdbc.update("DELETE FROM dori WHERE dorixona_id IN (" + idRoyxat + ")");
            int dorixonalar = jdbc.update("DELETE FROM dorixona WHERE id IN (" + idRoyxat + ")");
            log.info("Namuna ma'lumotlar tozalandi: {} ta dorixona, {} ta dori.", dorixonalar, dorilar);
        } catch (Exception e) {
            log.warn("Namuna dorixonalarni tozalab bo'lmadi: {}", e.getMessage());
        }
    }
}
