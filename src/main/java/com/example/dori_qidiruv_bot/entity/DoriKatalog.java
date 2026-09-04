package com.example.dori_qidiruv_bot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Butun O'zbekiston bo'yicha dorilar (va dorixona mahsulotlari) katalogi.
 * Bu faqat ma'lumotnoma ro'yxati — narx yoki qoldiq bu yerda saqlanmaydi.
 * Dorixona egasi o'z mahsulotini kiritganda shu ro'yxatdan tanlaydi, keyin
 * o'z narxi va qoldig'ini {@link Dori} jadvaliga yozadi.
 *
 * Ma'lumot Vazira Pharm (F-APTEKA) eksportidan olingan (~26 ming nom).
 * Nomlar ruscha; import qilishda "NOM\ISHLAB CHIQARUVCHI, DAVLAT" ko'rinishidagi
 * matn uchta ustunga ajratilgan.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "dori_katalog", indexes = {
        @Index(name = "idx_katalog_nomi", columnList = "nomi")
})
public class DoriKatalog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** To'liq nomi (doza/pachka bilan), masalan "ПАРАЦЕТАМОЛ ТАБ 500МГ №10". */
    @Column(name = "nomi", nullable = false, length = 500)
    private String nomi;

    /** Readable names; original supplier spelling remains in nomi. */
    @Column(name = "nomi_ru", length = 1000)
    private String nomiRu;

    @Column(name = "nomi_uz", length = 1000)
    private String nomiUz;

    /** Ishlab chiqaruvchi firma (bo'sh bo'lishi mumkin). */
    @Column(name = "ishlab_chiqaruvchi", length = 300)
    private String ishlabChiqaruvchi;

    /** Ishlab chiqarilgan davlat (bo'sh bo'lishi mumkin). */
    @Column(name = "davlat", length = 120)
    private String davlat;
}
