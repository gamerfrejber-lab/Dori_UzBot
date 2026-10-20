package com.example.dori_qidiruv_bot.repository;

import com.example.dori_qidiruv_bot.entity.DoriKatalog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Katalog qidiruvlari native SQL'da yozilgan: {@code ustun ILIKE '%so'z%'} pg_trgm GIN indeksidan foydalanadi
 * (IndeksYaratuvchi), {@code LOWER(ustun) LIKE ...} esa indeksni ishlatmay butun jadvalni o'qirdi.
 * Naqshlar (:p, :alt) chaqiruvchi tomonda tayyorlanadi: "%" va "_" ekranlangan, chetlariga "%" qo'shilgan.
 */
public interface DoriKatalogRepository extends JpaRepository<DoriKatalog, Long> {

    String MOS = "(k.nomi ILIKE :p OR k.nomi_ru ILIKE :p OR k.nomi_uz ILIKE :p OR k.ishlab_chiqaruvchi ILIKE :p "
            + "OR k.nomi ILIKE :alt OR k.ishlab_chiqaruvchi ILIKE :alt)";

    /** Katalog bo'yicha qidiruv (nomi, tarjimalari yoki ishlab chiqaruvchi bo'yicha). */
    @Query(value = "SELECT k.* FROM dori_katalog k WHERE " + MOS + " ORDER BY k.nomi LIMIT :limit", nativeQuery = true)
    List<DoriKatalog> qidirish(@Param("p") String p, @Param("alt") String alt, @Param("limit") int limit);

    /**
     * Autocomplete, 1-qadam: nomi shu so'z bilan BOSHLANADIGANLAR. Shart LIKE emas, oraliq ko'rinishida
     * ([so'z, so'z + eng katta Unicode belgisi)) yozilgan: tayyorlangan (prepared) so'rovning umumiy rejasida ham
     * (lower(nomi) COLLATE "C") indeksi bo'yicha tartiblangan o'qiladi — 1 mln qatorda bir necha millisekund.
     */
    @Query(value = "SELECT * FROM ("
            + "(SELECT k.* FROM dori_katalog k WHERE lower(k.nomi) COLLATE \"C\" >= lower(:bosh) COLLATE \"C\" "
            + "AND lower(k.nomi) COLLATE \"C\" < (lower(:bosh) || chr(1114111)) COLLATE \"C\" "
            + "ORDER BY lower(k.nomi) COLLATE \"C\" LIMIT :limit) "
            + "UNION "
            + "(SELECT k.* FROM dori_katalog k WHERE lower(k.nomi) COLLATE \"C\" >= lower(:boshAlt) COLLATE \"C\" "
            + "AND lower(k.nomi) COLLATE \"C\" < (lower(:boshAlt) || chr(1114111)) COLLATE \"C\" "
            + "ORDER BY lower(k.nomi) COLLATE \"C\" LIMIT :limit)"
            + ") t ORDER BY lower(t.nomi) COLLATE \"C\" LIMIT :limit", nativeQuery = true)
    List<DoriKatalog> autocompleteBosh(@Param("bosh") String bosh, @Param("boshAlt") String boshAlt, @Param("limit") int limit);

    /** Autocomplete, 2-qadam (boshlanishi bo'yicha yetmasa): nomi ichida uchraydiganlar, trigram indeks bilan. */
    @Query(value = "SELECT k.* FROM dori_katalog k WHERE (k.nomi ILIKE :p OR k.nomi ILIKE :alt) "
            + "ORDER BY k.nomi LIMIT :limit", nativeQuery = true)
    List<DoriKatalog> autocompleteIchida(@Param("p") String p, @Param("alt") String alt, @Param("limit") int limit);

    /**
     * Katalogni sahifalab qidirish (admin). Jami soni 10 001 bilan chegaralangan: to'liq COUNT(*) har sahifada
     * butun mos qatorlarni sanardi, admin uchun "10 000+" yetarli.
     */
    @Query(value = "SELECT k.* FROM dori_katalog k WHERE " + MOS,
            countQuery = "SELECT COUNT(*) FROM (SELECT 1 FROM dori_katalog k WHERE " + MOS + " LIMIT 10001) t",
            nativeQuery = true)
    Page<DoriKatalog> royxatQidirish(@Param("p") String p, @Param("alt") String alt, Pageable pageable);

    /** Katalog bo'shmi — import uchun; COUNT(*) dan farqli birinchi qatorni topgach to'xtaydi. */
    @Query(value = "SELECT EXISTS (SELECT 1 FROM dori_katalog)", nativeQuery = true)
    boolean bormi();
}
