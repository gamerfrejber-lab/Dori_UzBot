package com.example.dori_qidiruv_bot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Dori yo'riqnomasi (qo'llanilishi, qabul qilish, doza, qarshi ko'rsatmalar...) — bir asosiy nom uchun bitta.
 * Matnni sun'iy intellekt yozadi (DoriMalumotService), admin tuzatishi mumkin. Jadval DoriMalumotService orqali
 * JdbcTemplate bilan to'ldiriladi; entity faqat jadvalni yaratish uchun.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "dori_malumot", indexes = {
        @Index(name = "idx_malumot_kalit", columnList = "kalit", unique = true),
        @Index(name = "idx_malumot_holat", columnList = "holat, ustuvor")
})
public class DoriMalumot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Asosiy nom (DoriKalit.kalit). */
    @Column(name = "kalit", nullable = false, length = 300)
    private String kalit;

    /** Shu nomdagi mahsulotlar (shakl va dozalari bilan), qator bilan ajratilgan — so'rovga beriladi. */
    @Column(name = "namunalar", columnDefinition = "text")
    private String namunalar;

    @Column(name = "ishlab_chiqaruvchi", length = 300)
    private String ishlabChiqaruvchi;

    @Column(name = "davlat", length = 120)
    private String davlat;

    /** KUTMOQDA → NAVBATDA (so'rov yuborildi) → TAYYOR / DORI_EMAS / XATO. */
    @Column(name = "holat", nullable = false, length = 20)
    private String holat;

    /** 2 — dorixonalarda sotuvda bor yoki saytda ochilgan; 1 — faqat katalogda. */
    @Column(name = "ustuvor", nullable = false)
    private Integer ustuvor;

    /** Yo'riqnoma JSON ko'rinishida (o'zbekcha va ruscha). */
    @Column(name = "malumot", columnDefinition = "text")
    private String malumot;

    @Column(name = "batch_id", length = 100)
    private String batchId;

    @Column(name = "urinish")
    private Integer urinish;

    @Column(name = "xato", columnDefinition = "text")
    private String xato;

    /** Admin qo'lda tuzatgan — avtomatik qayta yozilmaydi. */
    @Column(name = "tahrirlangan")
    private Boolean tahrirlangan;

    @Column(name = "yangilangan")
    private LocalDateTime yangilangan;
}
