package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.entity.Dorixona;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dorixona")
@RequiredArgsConstructor
public class DorixonaController {

    private final DorixonaRepository dorixonaRepository;
    private final DoriRepository doriRepository;

    /**
     * Barcha dorixonalarni olish
     */
    @GetMapping
    public ResponseEntity<List<Dorixona>> getAll() {
        return ResponseEntity.ok(dorixonaRepository.findAll());
    }

    /**
     * ID bo'yicha dorixona olish
     */
    @GetMapping("/{id}")
    public ResponseEntity<Dorixona> getById(@PathVariable Long id) {
        return dorixonaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Berilgan dorixonadagi barcha dorilar — foydalanuvchi dorixona kartasini bosganda ko'rsatiladi
     */
    @GetMapping("/{id}/dorilar")
    public ResponseEntity<List<Dori>> getDrugs(@PathVariable Long id) {
        if (dorixonaRepository.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(doriRepository.findByDorixonaIdOrderByNameAsc(id));
    }

    /**
     * Yangi dorixona qo'shish
     */
    @PostMapping
    public ResponseEntity<Dorixona> create(@RequestBody Dorixona dorixona) {
        Dorixona saved = dorixonaRepository.save(dorixona);
        return ResponseEntity.ok(saved);
    }

    /**
     * Dorixonani yangilash
     */
    @PutMapping("/{id}")
    public ResponseEntity<Dorixona> update(@PathVariable Long id, @RequestBody Dorixona dorixona) {
        if (!dorixonaRepository.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        dorixona.setId(id);
        Dorixona updated = dorixonaRepository.save(dorixona);
        return ResponseEntity.ok(updated);
    }

    /**
     * Dorixonani o'chirish
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!dorixonaRepository.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        dorixonaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
