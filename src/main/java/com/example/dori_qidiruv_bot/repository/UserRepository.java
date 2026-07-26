package com.example.dori_qidiruv_bot.repository;

import com.example.dori_qidiruv_bot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Telefon raqami bo'yicha qidiradi. Faqat raqamlar solishtiriladi, chunki bot Telegram
     * kontaktidan "998..." (+ belgisiz), veb-sayt esa "+998..." ko'rinishida saqlashi mumkin.
     */
    @Query(value = "SELECT * FROM bot_user WHERE regexp_replace(phone, '[^0-9]', '', 'g') "
            + "= regexp_replace(:phone, '[^0-9]', '', 'g') LIMIT 1", nativeQuery = true)
    Optional<User> findByPhoneNumber(@Param("phone") String phoneNumber);
}
