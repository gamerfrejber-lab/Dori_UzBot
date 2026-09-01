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

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "dorixona")
public class Dorixona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nomi")
    private String name;

    @Column(name = "manzil")
    private String address;

    @Column(name = "telefon")
    private String telefon;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "karta_raqami")
    private String kartaRaqami;

    @Column(name = "obuna_tugashi")
    private LocalDateTime obunaTugashi;

    @Column(name = "ish_boshlanishi")
    private String ishBoshlanishi;

    @Column(name = "ish_tugashi")
    private String ishTugashi;
}
