package com.example.dori_qidiruv_bot.controller;

import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.entity.Dorixona;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import com.example.dori_qidiruv_bot.service.DoriService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dorixona")
@RequiredArgsConstructor
public class DorixonaController {

    private final DorixonaRepository dorixonaRepository;
    private final DoriService doriService;

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
        if (!dorixonaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(doriService.dorixonaDorilari(id));
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
    public ResponseEntity<Dorixona> update(@PathVariable Long id, @RequestBody Dorixona yangi) {
        return dorixonaRepository.findById(id)
                .map(mavjud -> {
                    if (yangi.getName() != null) mavjud.setName(yangi.getName());
                    if (yangi.getAddress() != null) mavjud.setAddress(yangi.getAddress());
                    if (yangi.getTelefon() != null) mavjud.setTelefon(yangi.getTelefon());
                    if (yangi.getKartaRaqami() != null) mavjud.setKartaRaqami(yangi.getKartaRaqami());
                    if (yangi.getLatitude() != null) mavjud.setLatitude(yangi.getLatitude());
                    if (yangi.getLongitude() != null) mavjud.setLongitude(yangi.getLongitude());
                    if (yangi.getIshBoshlanishi() != null) mavjud.setIshBoshlanishi(yangi.getIshBoshlanishi());
                    if (yangi.getIshTugashi() != null) mavjud.setIshTugashi(yangi.getIshTugashi());
                    return ResponseEntity.ok(dorixonaRepository.save(mavjud));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Dorixonani o'chirish
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!dorixonaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        dorixonaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
