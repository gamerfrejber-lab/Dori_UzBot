package com.example.dori_qidiruv_bot.repository;

import com.example.dori_qidiruv_bot.entity.Dori;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DoriRepository extends JpaRepository<Dori, Long> {

    @Query("SELECT d FROM Dori d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :name, '%')) "
            + "OR LOWER(d.nameRu) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Dori> findByNameContainingIgnoreCase(@Param("name") String name);

    /** Berilgan dorixonadagi barcha dorilar (nomi bo'yicha alifbo tartibida). */
    List<Dori> findByDorixonaIdOrderByNameAsc(Long dorixonaId);
}
