package com.example.dori_qidiruv_bot.repository;

import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.entity.Dorixona;
import org.springframework.data.domain.Pageable;
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
            + "AND (dx.shartnomaTugash IS NULL OR dx.shartnomaTugash >= CURRENT_DATE) ";

    @Query("SELECT d FROM Dori d JOIN Dorixona dx ON dx.id = d.dorixonaId "
            + "WHERE " + FAOL_DORIXONA
            + "AND (LOWER(d.name) LIKE LOWER(CONCAT('%', :name, '%')) "
            + "OR LOWER(d.nameRu) LIKE LOWER(CONCAT('%', :name, '%')) "
            + "OR LOWER(d.name) LIKE LOWER(CONCAT('%', :alt, '%')) "
            + "OR LOWER(d.nameRu) LIKE LOWER(CONCAT('%', :alt, '%')))")
    List<Dori> findByNameContainingIgnoreCase(@Param("name") String name, @Param("alt") String alt, Pageable pageable);

    /** Kategoriyadagi dorilar; :belgi vergul bilan o'ralgan holda beriladi (",yurak,"). */
    @Query("SELECT d FROM Dori d JOIN Dorixona dx ON dx.id = d.dorixonaId "
            + "WHERE " + FAOL_DORIXONA
            + "AND d.kategoriya LIKE CONCAT('%', :belgi, '%') ORDER BY d.name")
    List<Dori> findByKategoriya(@Param("belgi") String belgi, Pageable pageable);

    /** Berilgan dorixonadagi barcha dorilar (nomi bo'yicha alifbo tartibida). */
    List<Dori> findByDorixonaIdOrderByNameAsc(Long dorixonaId);

    /** Berilgan dorixonadagi barcha dorilarni o'chirish (Excel import — yangilash rejimi). */
    void deleteByDorixonaId(Long dorixonaId);
}
