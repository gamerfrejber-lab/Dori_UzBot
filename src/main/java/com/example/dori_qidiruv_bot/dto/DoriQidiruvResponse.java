package com.example.dori_qidiruv_bot.dto;

import com.example.dori_qidiruv_bot.entity.Dorixona;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoriQidiruvResponse {
    private String name;
    private String nameRu;
    private String manufacturer;
    private Double price;
    private Boolean available;
    private Dorixona dorixona;

    /** Omborda qolgani (kirim minus chiqim); hisob yuritilmagan bo'lsa 0. */
    private Long qoldiq;

    /** Ombor hisobi yuritilyaptimi — 0 qoldiq "tugagan"mi yoki shunchaki hisobsizmi. */
    private Boolean hisobYuritiladi;
}
