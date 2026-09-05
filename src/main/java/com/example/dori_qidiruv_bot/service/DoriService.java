package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.dto.DoriQidiruvResponse;
import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.entity.DoriKatalog;
import com.example.dori_qidiruv_bot.entity.Dorixona;
import com.example.dori_qidiruv_bot.repository.DoriKatalogRepository;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.dori_qidiruv_bot.util.LatCyrUtil;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoriService {
    private final DoriRepository doriRepository;
    private final DorixonaRepository dorixonaRepository;
    private final DoriKatalogRepository katalogRepository;
    private final OmborService omborService;

    /**
     * Katalogdan (butun O'zbekiston ro'yxati) qidirish — dori qo'shishda tanlash uchun.
     * Natijalar soni cheklanadi (avtomatik to'ldirish ro'yxati juda uzun bo'lib ketmasligi uchun).
     */
    /** Katalogdagi jami dorilar soni. */
    public long katalogSoni() {
        return katalogRepository.count();
    }

    public List<DoriKatalog> katalogQidirish(String q, int limit) {
        if (q == null || q.trim().length() < 2) {
            return List.of();
        }
        int chegara = Math.max(1, Math.min(limit, 50));
        String trimmed = q.trim();
        String alt = translitAlt(trimmed);
        return katalogRepository.qidirish(trimmed, alt, PageRequest.of(0, chegara));
    }

    public List<DoriKatalog> katalogAutocomplete(String q, int limit) {
        if (q == null || q.trim().length() < 2) {
            return List.of();
        }
        int chegara = Math.max(1, Math.min(limit, 50));
        String trimmed = q.trim();
        String alt = translitAlt(trimmed);
        return katalogRepository.autocomplete(trimmed, alt, PageRequest.of(0, chegara));
    }

    /**
     * Katalogni sahifalab ko'rish (browse). q berilsa qidiruv, bo'lmasa hammasi alifbo tartibida.
     * Natija: jami soni + shu sahifadagi dorilar.
     */
    public Map<String, Object> katalogRoyxat(String q, int page, int size) {
        int olcham = Math.max(1, Math.min(size, 100));
        int sahifa = Math.max(0, page);
        org.springframework.data.domain.Page<DoriKatalog> natija;
        if (q != null && !q.trim().isEmpty()) {
            String trimmed = q.trim();
            String alt = translitAlt(trimmed);
            natija = katalogRepository.royxatQidirish(trimmed, alt,
                    PageRequest.of(sahifa, olcham, org.springframework.data.domain.Sort.by("nomi")));
        } else {
            natija = katalogRepository.findAll(
                    PageRequest.of(sahifa, olcham, org.springframework.data.domain.Sort.by("nomi")));
        }
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("jami", natija.getTotalElements());
        map.put("sahifa", sahifa);
        map.put("sahifalarSoni", natija.getTotalPages());
        map.put("dorilar", natija.getContent());
        return map;
    }

    public List<DoriQidiruvResponse> qidirish(String nomi) {
        String alt = LatCyrUtil.hasLatin(nomi) ? LatCyrUtil.latToCyr(nomi)
                   : LatCyrUtil.hasCyrillic(nomi) ? LatCyrUtil.cyrToLat(nomi) : nomi;
        List<Dori> dorilar = doriRepository.findByNameContainingIgnoreCase(nomi, alt, PageRequest.of(0, 50));
        Map<Long, long[]> qoldiqlar = omborService.qoldiqlar();

        List<Long> dorixonaIds = dorilar.stream()
                .map(Dori::getDorixonaId)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, Dorixona> dorixonaMap = dorixonaRepository.findAllById(dorixonaIds).stream()
                .collect(Collectors.toMap(Dorixona::getId, d -> d));

        return dorilar.stream()
                .map(dori -> {
                    Dorixona dorixona = dorixonaMap.get(dori.getDorixonaId());
                    long[] ombor = qoldiqlar.getOrDefault(dori.getId(), new long[] { 0, 0 });
                    return new DoriQidiruvResponse(
                            dori.getId(),
                            dori.getName(),
                            dori.getNameRu(),
                            dori.getManufacturer(),
                            dori.getPrice(),
                            dori.getPachkaNarx(),
                            dori.getPachkadagiDona(),
                            dori.getAvailable(),
                            dorixona,
                            ombor[0],
                            ombor[1] > 0
                    );
                })
                .collect(Collectors.toList());
    }

    /** Dorixonadagi mahsulotlar, har birida ombor qoldig'i bilan. */
    public List<Dori> dorixonaDorilari(Long dorixonaId) {
        List<Dori> dorilar = doriRepository.findByDorixonaIdOrderByNameAsc(dorixonaId);
        Map<Long, long[]> qoldiqlar = omborService.qoldiqlar();
        for (Dori dori : dorilar) {
            long[] ombor = qoldiqlar.getOrDefault(dori.getId(), new long[] { 0, 0 });
            dori.setQoldiq(ombor[0]);
            dori.setHisobYuritiladi(ombor[1] > 0);
        }
        return dorilar;
    }

    public Dori doriQoshish(Dori dori) {
        return doriRepository.save(dori);
    }

    /**
     * Mavjud dorini xavfsiz yangilaydi: bazadan yuklab, faqat kelgan (null bo'lmagan)
     * maydonlarni o'zgartiradi. Shu tariqa narxni tahrirlaganda nom, firma yoki dorixona
     * bog'lanishi o'chib ketmaydi.
     */
    public Dori doriYangilash(Long id, Dori yangi) {
        Dori mavjud = doriRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dori topilmadi: " + id));
        if (yangi.getName() != null) mavjud.setName(yangi.getName());
        if (yangi.getNameRu() != null) mavjud.setNameRu(yangi.getNameRu());
        if (yangi.getManufacturer() != null) mavjud.setManufacturer(yangi.getManufacturer());
        if (yangi.getPrice() != null) mavjud.setPrice(yangi.getPrice());
        if (yangi.getPachkaNarx() != null) mavjud.setPachkaNarx(yangi.getPachkaNarx());
        if (yangi.getPachkadagiDona() != null) mavjud.setPachkadagiDona(yangi.getPachkadagiDona());
        if (yangi.getAvailable() != null) mavjud.setAvailable(yangi.getAvailable());
        if (yangi.getDorixonaId() != null) mavjud.setDorixonaId(yangi.getDorixonaId());
        return doriRepository.save(mavjud);
    }

    public List<Dori> barchaDorilar() {
        return doriRepository.findAll();
    }

    public void doriOchirish(Long id) {
        doriRepository.deleteById(id);
    }

    @Transactional
    public int excelImportYangilash(Long dorixonaId, MultipartFile file) throws IOException {
        dorixonaRepository.findById(dorixonaId)
                .orElseThrow(() -> new IllegalArgumentException("Dorixona topilmadi: " + dorixonaId));
        doriRepository.deleteByDorixonaId(dorixonaId);
        return excelParse(file, dorixonaId);
    }

    @Transactional
    public int excelImportQoshish(Long dorixonaId, MultipartFile file) throws IOException {
        dorixonaRepository.findById(dorixonaId)
                .orElseThrow(() -> new IllegalArgumentException("Dorixona topilmadi: " + dorixonaId));
        return excelParse(file, dorixonaId);
    }

    private int excelParse(MultipartFile file, Long dorixonaId) throws IOException {
        List<Dori> dorilar = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row header = sheet.getRow(0);
            int[] cols = ustunlarniAniqla(header);
            int colNomi = cols[0], colNarx = cols[1], colFirma = cols[2],
                colNomiRu = cols[3], colPachkaNarx = cols[4], colPachkaDona = cols[5];

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String nomi = cellText(row, colNomi);
                if (nomi.isEmpty()) continue;

                Dori dori = new Dori();
                dori.setName(nomi);
                dori.setNameRu(colNomiRu >= 0 ? nullIfEmpty(cellText(row, colNomiRu)) : null);
                dori.setManufacturer(colFirma >= 0 ? nullIfEmpty(cellText(row, colFirma)) : null);
                dori.setPrice(colNarx >= 0 ? cellNumber(row, colNarx) : null);
                dori.setPachkaNarx(colPachkaNarx >= 0 ? cellNumber(row, colPachkaNarx) : null);
                if (colPachkaDona >= 0) {
                    Double pd = cellNumber(row, colPachkaDona);
                    dori.setPachkadagiDona(pd != null ? pd.intValue() : null);
                }
                dori.setAvailable(true);
                dori.setDorixonaId(dorixonaId);
                dorilar.add(dori);
            }
        }
        doriRepository.saveAll(dorilar);
        return dorilar.size();
    }

    private int[] ustunlarniAniqla(Row header) {
        int colNomi = -1, colNarx = -1, colFirma = -1,
            colNomiRu = -1, colPachkaNarx = -1, colPachkaDona = -1;
        if (header != null) {
            for (int c = 0; c < header.getLastCellNum(); c++) {
                String h = cellText(header, c).toLowerCase();
                if (colNomi < 0 && (h.contains("наименование") || h.contains("nomi") || h.contains("номи")
                        || h.contains("name") || h.contains("nom")))
                    colNomi = c;
                else if (colNarx < 0 && (h.contains("цена") || h.contains("narx") || h.contains("нарх")
                        || h.contains("price") || h.contains("dona")))
                    colNarx = c;
                else if (colFirma < 0 && (h.contains("производитель") || h.contains("ishlab") || h.contains("firma")
                        || h.contains("manufacturer") || h.contains("ишлаб")))
                    colFirma = c;
                else if (colNomiRu < 0 && (h.contains("nomi_ru") || h.contains("ruscha")))
                    colNomiRu = c;
                else if (colPachkaNarx < 0 && (h.contains("pachka_narx") || h.contains("pachka narx")))
                    colPachkaNarx = c;
                else if (colPachkaDona < 0 && (h.contains("pachkadagi") || h.contains("pachka dona")))
                    colPachkaDona = c;
            }
        }
        if (colNomi < 0) colNomi = 1;
        if (colNarx < 0) colNarx = 2;
        if (colFirma < 0) colFirma = 3;
        return new int[] { colNomi, colNarx, colFirma, colNomiRu, colPachkaNarx, colPachkaDona };
    }

    private String nullIfEmpty(String s) {
        return s == null || s.isEmpty() ? null : s;
    }

    private String cellText(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC) return String.valueOf((long) cell.getNumericCellValue());
        return "";
    }

    private String translitAlt(String text) {
        if (LatCyrUtil.hasLatin(text)) return LatCyrUtil.latToCyr(text);
        if (LatCyrUtil.hasCyrillic(text)) return LatCyrUtil.cyrToLat(text);
        return text;
    }

    private Double cellNumber(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            double val = cell.getNumericCellValue();
            return val > 0 ? val : null;
        }
        if (cell.getCellType() == CellType.STRING) {
            try { return Double.parseDouble(cell.getStringCellValue().trim()); }
            catch (NumberFormatException e) { return null; }
        }
        return null;
    }
}
