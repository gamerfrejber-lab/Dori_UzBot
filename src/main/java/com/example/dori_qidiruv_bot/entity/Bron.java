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
 * Bron — mijoz dorini oldindan band qiladi.
 *
 * Bu jadval uch joyga umumiy: sayt va mijozlar boti bron yozadi, dorixonalar boti esa
 * uni o'qib dorixona egasiga yetkazadi va javobini shu yerga yozadi. Shuning uchun
 * saytdan qilingan bron ham xuddi botdagidek dorixona egasiga boradi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bron")
public class Bron {

    public static final String YANGI = "YANGI";
    public static final String TAYYOR = "TAYYOR";
    public static final String BERILDI = "BERILDI";
    public static final String BEKOR = "BEKOR";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dori_id", nullable = false)
    private Long doriId;

    @Column(name = "dorixona_id", nullable = false)
    private Long dorixonaId;

    @Column(name = "mijoz_telegram_id")
    private Long mijozTelegramId;

    @Column(name = "mijoz_ismi")
    private String mijozIsmi;

    @Column(name = "mijoz_telefon")
    private String mijozTelefon;

    @Column(name = "soni", nullable = false)
    private Integer soni;

    @Column(name = "tur", length = 10)
    private String tur;

    /** Mijoz dorixonada aytadigan olib ketish kodi. */
    @Column(name = "kod", length = 10)
    private String kod;

    @Column(name = "holat", length = 20)
    private String holat;

    /** Dorixona egasiga yetkazilganmi (dorixonalar boti belgilaydi). */
    @Column(name = "egaga_xabar")
    private Boolean egagaXabar;

    /** Mijozga holat o'zgargani aytilganmi (mijozlar boti belgilaydi). */
    @Column(name = "mijozga_xabar")
    private Boolean mijozgaXabar;

    @Column(name = "sana")
    private LocalDateTime sana;
}
