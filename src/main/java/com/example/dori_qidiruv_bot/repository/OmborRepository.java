package com.example.dori_qidiruv_bot.repository;

import com.example.dori_qidiruv_bot.entity.OmborHarakat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Ombor hisobi. Qoldiq alohida ustunda saqlanmaydi — u har doim
 * kirim minus chiqim sifatida hisoblanadi, shuning uchun hisobot va qoldiq
 * bir-biriga hech qachon zid bo'lib qolmaydi.
 */
public interface OmborRepository extends JpaRepository<OmborHarakat, Long> {

    /** Bitta mahsulot bo'yicha hisobot satri. */
    interface Satr {
        Long getDoriId();
        String getNomi();
        Long getKelgan();
        Long getSotilgan();
        Double getNarx();
        Double getTushum();
    }

    /** Dori id -> qoldiq juftligi (ro'yxatlarda qoldiqni ko'rsatish uchun). */
    interface Qoldiq {
        Long getDoriId();
        Long getQoldiq();
        Long getKelgan();
    }

    @Query(value = """
            SELECT COALESCE(SUM(CASE WHEN turi = 'KIRIM' THEN soni ELSE -soni END), 0)
            FROM ombor_harakat WHERE dori_id = :doriId
            """, nativeQuery = true)
    long qoldiq(@Param("doriId") Long doriId);

    /**
     * Chiqim (sotuv) yozadi. Tekshiruv va yozuv bitta SQL buyrug'ida bajarilgani uchun
     * bir vaqtda kelgan ikki sotuv ham qoldiqni manfiyga tushira olmaydi.
     * Qoldiq yetmasa 0 qaytadi (hech narsa yozilmaydi).
     */
    @Modifying
    @Query(value = """
            INSERT INTO ombor_harakat (dori_id, turi, soni, narx, izoh, sana)
            SELECT :doriId, 'CHIQIM', :soni, :narx, :izoh, NOW()
            WHERE COALESCE((SELECT SUM(CASE WHEN turi = 'KIRIM' THEN soni ELSE -soni END)
                            FROM ombor_harakat WHERE dori_id = :doriId), 0) >= :soni
            """, nativeQuery = true)
    int chiqimYoz(@Param("doriId") Long doriId,
                  @Param("soni") int soni,
                  @Param("narx") Double narx,
                  @Param("izoh") String izoh);

    /**
     * Dorixona bo'yicha to'liq hisobot: har bir mahsulot uchun qancha kelgan, qancha
     * sotilgan va sotuvdan qancha tushgan. Harakati bo'lmagan mahsulotlar ham nol
     * qiymatlar bilan ro'yxatga kiradi.
     */
    @Query(value = """
            SELECT d.id AS doriId,
                   d.nomi AS nomi,
                   d.narx AS narx,
                   COALESCE(SUM(CASE WHEN h.turi = 'KIRIM'  THEN h.soni ELSE 0 END), 0) AS kelgan,
                   COALESCE(SUM(CASE WHEN h.turi = 'CHIQIM' THEN h.soni ELSE 0 END), 0) AS sotilgan,
                   COALESCE(SUM(CASE WHEN h.turi = 'CHIQIM'
                                     THEN h.soni * COALESCE(h.narx, d.narx) ELSE 0 END), 0) AS tushum
            FROM dori d
            LEFT JOIN ombor_harakat h ON h.dori_id = d.id
            WHERE d.dorixona_id = :dorixonaId
            GROUP BY d.id, d.nomi, d.narx
            ORDER BY d.nomi
            """, nativeQuery = true)
    List<Satr> hisobot(@Param("dorixonaId") Long dorixonaId);

    /** Harakati bo'lgan barcha mahsulotlarning qoldig'i (ro'yxatlarni bir so'rovda to'ldirish uchun). */
    @Query(value = """
            SELECT dori_id AS doriId,
                   COALESCE(SUM(CASE WHEN turi = 'KIRIM' THEN soni ELSE -soni END), 0) AS qoldiq,
                   COALESCE(SUM(CASE WHEN turi = 'KIRIM' THEN soni ELSE 0 END), 0) AS kelgan
            FROM ombor_harakat
            GROUP BY dori_id
            """, nativeQuery = true)
    List<Qoldiq> barchaQoldiqlar();

    /** Butun tizim bo'yicha jami. */
    interface Umumiy {
        Long getKelgan();
        Long getSotilgan();
        Double getTushum();
    }

    @Query(value = """
            SELECT COALESCE(SUM(CASE WHEN h.turi = 'KIRIM'  THEN h.soni ELSE 0 END), 0) AS kelgan,
                   COALESCE(SUM(CASE WHEN h.turi = 'CHIQIM' THEN h.soni ELSE 0 END), 0) AS sotilgan,
                   COALESCE(SUM(CASE WHEN h.turi = 'CHIQIM'
                                     THEN h.soni * COALESCE(h.narx, d.narx) ELSE 0 END), 0) AS tushum
            FROM ombor_harakat h
            JOIN dori d ON d.id = h.dori_id
            """, nativeQuery = true)
    Umumiy umumiy();
}
