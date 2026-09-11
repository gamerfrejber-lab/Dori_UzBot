package com.example.dori_qidiruv_bot.repository;

import com.example.dori_qidiruv_bot.entity.Dorixona;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DorixonaRepository extends JpaRepository<Dorixona, Long> {
    Dorixona findByEgasiTelegramId(Long egasiTelegramId);
}
