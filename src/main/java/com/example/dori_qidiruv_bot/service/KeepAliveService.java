package com.example.dori_qidiruv_bot.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Slf4j
@Component
public class KeepAliveService {

    @Value("${app.keep-alive-url:}")
    private String keepAliveUrl;

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // Render free servislar 15 daqiqa so'rovsiz qolsa uxlaydi — 10 daqiqada bir ping yetarli.
    @Scheduled(fixedRate = 600_000)
    public void ping() {
        if (keepAliveUrl == null || keepAliveUrl.isBlank()) return;
        for (String url : keepAliveUrl.split(",")) {
            if (url.isBlank()) continue;
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url.trim()))
                        .timeout(Duration.ofSeconds(60))
                        .GET()
                        .build();
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                log.debug("Keep-alive ping {}: {}", url.trim(), response.statusCode());
            } catch (Exception e) {
                log.warn("Keep-alive ping muvaffaqiyatsiz ({}): {}", url.trim(), e.getMessage());
            }
        }
    }
}
