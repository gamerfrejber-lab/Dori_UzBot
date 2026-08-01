package com.example.dori_qidiruv_bot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Dorixona egaligi arizasi — dorixonalar botida beriladi, admin esa uni botdan ham,
 * saytdan ham ko'rib hal qiladi.
 *
 * Dalil suratlari baytlar sifatida saqlanadi: Telegram bergan file_id faqat uni
 * yuklagan botda ishlaydi, shuning uchun sayt o'sha id bilan rasmni ko'rsata olmaydi.
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "dorixona_soov")
public class Soov {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dorixona_id", nullable = false)
    private Long dorixonaId;

    @Column(name = "telegram_id", nullable = false)
    private Long telegramId;

    @Column(name = "ism")
    private String ism;

    @Column(name = "username")
    private String username;

    @Column(name = "telefon")
    private String telefon;

    @Column(name = "litsenziya_file_id")
    private String litsenziyaFileId;

    @Column(name = "jonli_rasm_file_id")
    private String jonliRasmFileId;

    // @Lob ishlatilmaydi: Postgres'da u ustunni "oid" (katta obyekt) turiga o'tkazmoqchi
    // bo'ladi, ustun esa "bytea" — natijada Hibernate har ishga tushganda ustunni
    // o'zgartirishga urinib xato berardi. Oddiy byte[] to'g'ri "bytea"ga mos keladi.
    @Column(name = "litsenziya_rasm")
    private byte[] litsenziyaRasm;

    @Column(name = "jonli_rasm")
    private byte[] jonliRasm;

    @Column(name = "tekshiruv_kodi", length = 10)
    private String tekshiruvKodi;

    @Column(name = "holat", length = 20)
    private String holat;

    @Column(name = "admin_izoh", length = 500)
    private String adminIzoh;

    /** Saytdagi/botdagi adminga ko'rsatilganmi. */
    @Column(name = "adminga_xabar")
    private Boolean admingaXabar;

    /** Qaror dorixona egasiga aytilganmi (dorixonalar boti belgilaydi). */
    @Column(name = "egaga_xabar")
    private Boolean egagaXabar;

    @Column(name = "sana")
    private LocalDateTime sana;
}
