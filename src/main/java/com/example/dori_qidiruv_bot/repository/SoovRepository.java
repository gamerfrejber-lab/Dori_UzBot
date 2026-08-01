package com.example.dori_qidiruv_bot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.dori_qidiruv_bot.entity.Soov;

import java.util.List;

/**
 * Dorixona egaligi arizalari. Ariza dorixonalar botida beriladi, lekin admin uni
 * saytdan ham ko'rib hal qila oladi — uchala tizim bitta bazadan ishlaydi.
 */
public interface SoovRepository extends JpaRepository<Soov, Long> {

    String KUTILMOQDA = "KUTILMOQDA";
    String TASDIQLANGAN = "TASDIQLANGAN";
    String RAD = "RAD";

    /** Admin ko'radigan ariza satri (rasm baytlarisiz — ular alohida olinadi). */
    interface Qator {
        Long getId();
        Long getDorixonaId();
        String getDorixonaNomi();
        Long getTelegramId();
        String getIsm();
        String getUsername();
        String getTelefon();
        String getTekshiruvKodi();
        String getHolat();
        java.time.LocalDateTime getSana();
    }

    @Query(value = """
            SELECT s.id AS id, s.dorixona_id AS dorixonaId, p.nomi AS dorixonaNomi,
                   s.telegram_id AS telegramId, s.ism AS ism, s.username AS username,
                   s.telefon AS telefon, s.tekshiruv_kodi AS tekshiruvKodi,
                   s.holat AS holat, s.sana AS sana
            FROM dorixona_soov s
            JOIN dorixona p ON p.id = s.dorixona_id
            WHERE s.holat = 'KUTILMOQDA'
            ORDER BY s.id
            """, nativeQuery = true)
    List<Qator> kutilayotganlar();

    /** Dalil surati — baytlar bilan (file_id faqat uni yuklagan botda ishlaydi). */
    @Query(value = "SELECT litsenziya_rasm FROM dorixona_soov WHERE id = :id", nativeQuery = true)
    byte[] litsenziyaRasm(@Param("id") Long id);

    @Query(value = "SELECT jonli_rasm FROM dorixona_soov WHERE id = :id", nativeQuery = true)
    byte[] jonliRasm(@Param("id") Long id);

    /**
     * Arizani hal qiladi. Faqat hali ko'rib chiqilmagani o'zgaradi — shuning uchun
     * admin sayt va botdan bir vaqtda bossa ham ikki marta bajarilmaydi.
     * egaga_xabar tushiriladi: qarorni dorixona egasiga dorixonalar boti yetkazadi.
     */
    @Modifying
    @Query(value = """
            UPDATE dorixona_soov SET holat = :holat, egaga_xabar = FALSE, adminga_xabar = TRUE
            WHERE id = :id AND holat = 'KUTILMOQDA'
            """, nativeQuery = true)
    int hal(@Param("id") Long id, @Param("holat") String holat);

    /** Dorixonani egasiga biriktiradi. Boshqa birov band qilib ulgurgan bo'lsa 0 qaytadi. */
    @Modifying
    @Query(value = """
            UPDATE dorixona SET egasi_telegram_id = :telegramId
            WHERE id = :dorixonaId AND egasi_telegram_id IS NULL
            """, nativeQuery = true)
    int egasiniBiriktir(@Param("dorixonaId") Long dorixonaId, @Param("telegramId") Long telegramId);
}
