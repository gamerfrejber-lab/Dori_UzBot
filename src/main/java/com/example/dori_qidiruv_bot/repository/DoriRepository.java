package com.example.dori_qidiruv_bot.repository;

import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.entity.Dorixona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DoriRepository extends JpaRepository<Dori, Long> {

    @Query("SELECT d FROM Dori d JOIN Dorixona dx ON dx.id = d.dorixonaId "
            + "WHERE (dx.obunaTugashi IS NULL OR dx.obunaTugashi > CURRENT_TIMESTAMP) "
            + "AND (LOWER(d.name) LIKE LOWER(CONCAT('%', :name, '%')) "
            + "OR LOWER(d.nameRu) LIKE LOWER(CONCAT('%', :name, '%')) "
            + "OR LOWER(d.name) LIKE LOWER(CONCAT('%', :alt, '%')) "
            + "OR LOWER(d.nameRu) LIKE LOWER(CONCAT('%', :alt, '%')))")
    List<Dori> findByNameContainingIgnoreCase(@Param("name") String name, @Param("alt") String alt);

    /** Berilgan dorixonadagi barcha dorilar (nomi bo'yicha alifbo tartibida). */
    List<Dori> findByDorixonaIdOrderByNameAsc(Long dorixonaId);

    /** Berilgan dorixonadagi barcha dorilarni o'chirish (Excel import — yangilash rejimi). */
    void deleteByDorixonaId(Long dorixonaId);
}
