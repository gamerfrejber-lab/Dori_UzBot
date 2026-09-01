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

    @Scheduled(fixedRate = 840_000)
    public void ping() {
        if (keepAliveUrl == null || keepAliveUrl.isBlank()) return;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(keepAliveUrl))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            log.debug("Keep-alive ping: {}", response.statusCode());
        } catch (Exception e) {
            log.warn("Keep-alive ping muvaffaqiyatsiz: {}", e.getMessage());
        }
    }
}
