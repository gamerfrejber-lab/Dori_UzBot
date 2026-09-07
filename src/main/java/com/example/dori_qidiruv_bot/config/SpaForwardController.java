package com.example.dori_qidiruv_bot.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping({"/dorixonalar", "/login", "/sms", "/profil", "/admin"})
    public String forward() {
        return "forward:/index.html";
    }
}
