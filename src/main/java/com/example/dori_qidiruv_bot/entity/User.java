package com.example.dori_qidiruv_bot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Foydalanuvchi — bot bilan umumiy bo'lgan bot_user jadvaliga bog'langan. Yozuv Telegram
 * botda /start bosilganda yaratiladi (telegram_id = birlamchi kalit), veb-sayt esa shu
 * yozuvni telefon raqami bo'yicha topib, tasdiqlash kodi maydonlarini to'ldiradi.
 * Shu tufayli bot va sayt bitta foydalanuvchini ko'radi va ma'lumot server qayta
 * ishga tushganda yo'qolmaydi.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bot_user")
public class User {

    @Id
    @Column(name = "telegram_id")
    private Long id;

    @Column(name = "phone")
    private String phoneNumber;

    @Column(name = "full_name")
    private String name;

    @Column(name = "verification_code")
    private String verificationCode;

    @Column(name = "code_expiry")
    private LocalDateTime codeExpiry;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;
}
