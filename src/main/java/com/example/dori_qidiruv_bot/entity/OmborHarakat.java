package com.example.dori_qidiruv_bot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Ombor harakati: bitta kirim (mahsulot keldi) yoki chiqim (sotildi) yozuvi.
 * Bot ham, veb-sayt ham shu jadvalga yozadi. Qoldiq alohida saqlanmaydi —
 * u har doim kirim minus chiqim sifatida hisoblanadi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "ombor_harakat")
public class OmborHarakat {

    public static final String KIRIM = "KIRIM";
    public static final String CHIQIM = "CHIQIM";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dori_id", nullable = false)
    private Long doriId;

    /** KIRIM yoki CHIQIM. */
    @Column(name = "turi", nullable = false, length = 10)
    private String turi;

    @Column(name = "soni", nullable = false)
    private Integer soni;

    /** Shu harakatdagi dona narxi (bo'sh bo'lsa dorining joriy narxi ishlatiladi). */
    @Column(name = "narx")
    private Double narx;

    @Column(name = "izoh", length = 500)
    private String izoh;

    @Column(name = "sana")
    private LocalDateTime sana;
}
