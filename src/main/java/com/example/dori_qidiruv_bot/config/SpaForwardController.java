package com.example.dori_qidiruv_bot.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    // ".html" variantlari — eski saytdan qolgan havolalar va xatcho'plar bo'sh sahifa ochmasligi uchun.
    @GetMapping({"/dorixonalar", "/login", "/sms", "/profil", "/admin", "/dorixonachi", "/kategoriya/**",
            "/dorixonalar.html", "/login.html", "/sms.html", "/profil.html", "/admin.html"})
    public String forward() {
        return "forward:/index.html";
    }
}
