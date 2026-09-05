package com.example.dori_qidiruv_bot.repository;

import com.example.dori_qidiruv_bot.entity.DoriKatalog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DoriKatalogRepository extends JpaRepository<DoriKatalog, Long> {

    /**
     * Katalog bo'yicha qidiruv (nomi yoki ishlab chiqaruvchi bo'yicha).
     * Avtomatik to'ldirish uchun — natijalar soni Pageable orqali cheklanadi.
     */
    @Query("SELECT k FROM DoriKatalog k WHERE LOWER(k.nomi) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(k.nomiRu) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(k.nomiUz) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(k.ishlabChiqaruvchi) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(k.nomi) LIKE LOWER(CONCAT('%', :alt, '%')) "
            + "OR LOWER(k.ishlabChiqaruvchi) LIKE LOWER(CONCAT('%', :alt, '%')) "
            + "ORDER BY k.nomi ASC")
    List<DoriKatalog> qidirish(@Param("q") String q, @Param("alt") String alt, Pageable pageable);

    @Query("SELECT k FROM DoriKatalog k WHERE LOWER(k.nomi) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(k.nomi) LIKE LOWER(CONCAT('%', :alt, '%')) "
            + "ORDER BY CASE WHEN LOWER(k.nomi) LIKE LOWER(CONCAT(:q, '%')) OR LOWER(k.nomi) LIKE LOWER(CONCAT(:alt, '%')) THEN 0 ELSE 1 END, k.nomi ASC")
    List<DoriKatalog> autocomplete(@Param("q") String q, @Param("alt") String alt, Pageable pageable);

    /** Katalogni sahifalab qidirish (jami soni bilan) — "Katalog" bo'limida ko'rish uchun. */
    @Query("SELECT k FROM DoriKatalog k WHERE LOWER(k.nomi) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(k.nomiRu) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(k.nomiUz) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(k.ishlabChiqaruvchi) LIKE LOWER(CONCAT('%', :q, '%')) "
            + "OR LOWER(k.nomi) LIKE LOWER(CONCAT('%', :alt, '%')) "
            + "OR LOWER(k.ishlabChiqaruvchi) LIKE LOWER(CONCAT('%', :alt, '%'))")
    Page<DoriKatalog> royxatQidirish(@Param("q") String q, @Param("alt") String alt, Pageable pageable);
}
