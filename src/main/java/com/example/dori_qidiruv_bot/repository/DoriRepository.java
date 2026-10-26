package com.example.dori_qidiruv_bot.repository;

import com.example.dori_qidiruv_bot.entity.Dori;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DoriRepository extends JpaRepository<Dori, Long> {

    /**
     * Faol dorixona — botdagi qoida bilan bir xil: holati "nofaol" emas va shartnomasi
     * tugamagan (sana yo'q bo'lsa cheklovsiz). Shunda sayt va bot bir xil dorilarni ko'rsatadi.
     */
    String FAOL_DORIXONA = "(dx.holat IS NULL OR LOWER(dx.holat) <> 'nofaol') "
            + "AND (dx.shartnoma_tugash IS NULL OR dx.shartnoma_tugash >= CURRENT_DATE) ";

    /**
     * Nomi bo'yicha qidiruv. ILIKE '%...%' pg_trgm GIN indeksidan (dori.nomi, dori.nomi_ru) foydalanadi;
     * avvalgi LOWER(...) LIKE butun jadvalni o'qirdi. :p va :alt — tayyor naqsh ("%so'z%"), :alt — boshqa yozuvda.
     */
    @Query(value = "SELECT d.* FROM dori d JOIN dorixona dx ON dx.id = d.dorixona_id "
            + "WHERE " + FAOL_DORIXONA
            + "AND (d.nomi ILIKE :p OR d.nomi_ru ILIKE :p OR d.nomi ILIKE :alt OR d.nomi_ru ILIKE :alt) "
            + "LIMIT :limit", nativeQuery = true)
    List<Dori> nomiBoyicha(@Param("p") String p, @Param("alt") String alt, @Param("limit") int limit);

    /** Kategoriyadagi dorilar; :belgi vergul bilan o'ralgan naqsh ("%,yurak,%") — kategoriya ustunidagi trigram indeks. */
    @Query(value = "SELECT d.* FROM dori d JOIN dorixona dx ON dx.id = d.dorixona_id "
            + "WHERE " + FAOL_DORIXONA
            + "AND d.kategoriya LIKE :belgi ORDER BY d.nomi LIMIT :limit", nativeQuery = true)
    List<Dori> kategoriyaBoyicha(@Param("belgi") String belgi, @Param("limit") int limit);

    /** Berilgan dorixonadagi barcha dorilar (nomi bo'yicha alifbo tartibida) — (dorixona_id, nomi) indeksi. */
    List<Dori> findByDorixonaIdOrderByNameAsc(Long dorixonaId);

    /** Dorixonada shu nomdagi mahsulot bormi (katta-kichik harf farqisiz) — bot ham takror nomni qabul qilmaydi. */
    boolean existsByDorixonaIdAndNameIgnoreCase(Long dorixonaId, String name);

    /** Berilgan dorixonadagi barcha dorilarni o'chirish (Excel import — yangilash rejimi). */
    void deleteByDorixonaId(Long dorixonaId);
}
