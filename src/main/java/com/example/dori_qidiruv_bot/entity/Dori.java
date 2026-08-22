package com.example.dori_qidiruv_bot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "dori")
public class Dori {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nomi")
    private String name;

    @Column(name = "nomi_ru")
    private String nameRu;

    @Column(name = "ishlab_chiqaruvchi")
    private String manufacturer;

    @Column(name = "narx")
    private Double price;

    @Column(name = "pachka_narx")
    private Double pachkaNarx;

    /** Bitta pachkadagi dona soni (masalan 10). Bo'sh bo'lishi mumkin. */
    @Column(name = "pachkadagi_dona")
    private Integer pachkadagiDona;

    @Column(name = "mavjud")
    private Boolean available;

    @Column(name = "dorixona_id")
    private Long dorixonaId;

    /**
     * Omborda qolgani (kirim minus chiqim). Bazada saqlanmaydi — ombor harakatlaridan
     * hisoblanadi va javobga qo'shib yuboriladi.
     */
    @Transient
    private Long qoldiq;

    /**
     * Bu mahsulot bo'yicha ombor hisobi yuritilyaptimi. Hech qanday kirim yozilmagan bo'lsa
     * qoldiq 0 chiqadi, lekin bu "tugagan" degani emas — shunchaki hisob yuritilmagan.
     */
    @Transient
    private Boolean hisobYuritiladi;
}
