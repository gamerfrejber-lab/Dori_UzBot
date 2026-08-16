package com.example.dori_qidiruv_bot.repository;

import com.example.dori_qidiruv_bot.entity.Bron;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BronRepository extends JpaRepository<Bron, Long> {

    /** Mijozning bronlari — dori va dorixona nomi bilan, eng yangisidan boshlab. */
    interface Qator {
        Long getId();
        String getDoriNomi();
        String getDorixonaNomi();
        String getManzil();
        String getTelefon();
        Integer getSoni();
        String getKod();
        String getHolat();
        String getTuri();
        Double getNarx();
        java.time.LocalDateTime getSana();
    }

    @Query(value = """
            SELECT b.id AS id,
                   d.nomi AS doriNomi,
                   d.narx AS narx,
                   p.nomi AS dorixonaNomi,
                   p.manzil AS manzil,
                   p.telefon AS telefon,
                   b.soni AS soni,
                   b.turi AS turi,
                   b.kod AS kod,
                   b.holat AS holat,
                   b.sana AS sana
            FROM bron b
            JOIN dori d ON d.id = b.dori_id
            JOIN dorixona p ON p.id = b.dorixona_id
            WHERE b.mijoz_telegram_id = :mijozId
            ORDER BY b.id DESC
            LIMIT 50
            """, nativeQuery = true)
    List<Qator> mijozniki(@Param("mijozId") Long mijozId);
}
