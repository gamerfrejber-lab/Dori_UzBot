package com.example.dori_qidiruv_bot.service;

import com.example.dori_qidiruv_bot.entity.Dori;
import com.example.dori_qidiruv_bot.repository.DoriRepository;
import com.example.dori_qidiruv_bot.repository.DorixonaRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Fayldan mahsulot qo'shish — dorixonalar botidagi "📁 Fayldan" bilan bir xil qoidalar, shuning uchun bitta
 * faylni botga yuborsa ham, saytga yuklasa ham natija bir xil:
 * <ul>
 *   <li>.xlsx, .xls, .csv yoki .txt; ustunlar — Nomi, Narxi, Soni (sarlavha bo'lsa — sarlavha bo'yicha);</li>
 *   <li>dorixonada bor yoki faylda takrorlangan nom qayta qo'shilmaydi;</li>
 *   <li>"Soni" bo'lsa — u birinchi kirim sifatida omborga yoziladi.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class FaylImport {

    private final DoriRepository doriRepository;
    private final DorixonaRepository dorixonaRepository;
    private final OmborService omborService;

    public record Natija(int qoshildi, int dublikat, int otkazildi) { }

    @Transactional
    public Natija qosh(Long dorixonaId, byte[] data) throws IOException {
        dorixonaRepository.findById(dorixonaId)
                .orElseThrow(() -> new IllegalArgumentException("Dorixona topilmadi: " + dorixonaId));
        List<String[]> qatorlar = oqi(data);

        // Ustunlar: sarlavha bo'lsa — sarlavha bo'yicha, aks holda botdagidek 1-nomi, 2-narxi, 3-soni.
        int cNomi = 0, cNarx = 1, cSoni = 2, cFirma = -1, cNomiRu = -1, cPachka = -1;
        int boshi = 0;
        if (!qatorlar.isEmpty()) {
            int[] s = sarlavha(qatorlar.get(0));
            if (s != null) {
                cNomi = s[0]; cNarx = s[1]; cSoni = s[2]; cFirma = s[3]; cNomiRu = s[4]; cPachka = s[5];
                boshi = 1;
            }
        }

        Set<String> mavjud = new HashSet<>();
        for (Dori d : doriRepository.findByDorixonaIdOrderByNameAsc(dorixonaId)) {
            if (d.getName() != null) mavjud.add(d.getName().trim().toLowerCase(Locale.ROOT));
        }

        int qoshildi = 0, dublikat = 0, otkazildi = 0;
        for (int i = boshi; i < qatorlar.size(); i++) {
            String[] q = qatorlar.get(i);
            int siljish = 0;
            // Sarlavhasiz faylda birinchi ustun tartib raqami bo'lsa (1, 2, 3 ...) — bitta o'ngga suriladi.
            if (boshi == 0 && q.length >= 3 && butunSon(ol(q, 0)) != null && narx(ol(q, 1)) == null) siljish = 1;
            String nomi = tozaNom(ol(q, cNomi + siljish));
            if (nomi.isEmpty()) { otkazildi++; continue; }
            String past = nomi.toLowerCase(Locale.ROOT);
            if (i == 0 && (past.startsWith("nom") || past.startsWith("назв") || past.startsWith("наим") || past.equals("name"))) continue;
            Double narx = narx(ol(q, cNarx + siljish));
            if (narx == null) { otkazildi++; continue; }
            Integer soni = cSoni >= 0 ? butunSon(ol(q, cSoni + siljish)) : null;
            if (!mavjud.add(past)) { dublikat++; continue; }

            Dori d = new Dori();
            d.setName(nomi);
            d.setPrice(narx);
            if (cNomiRu >= 0) d.setNameRu(boshBolsaNull(ol(q, cNomiRu)));
            if (cFirma >= 0) d.setManufacturer(boshBolsaNull(ol(q, cFirma)));
            if (cPachka >= 0) d.setPachkaNarx(narx(ol(q, cPachka)));
            d.setAvailable(true);
            d.setDorixonaId(dorixonaId);
            d = doriRepository.save(d);
            if (soni != null && soni > 0) omborService.kirim(d.getId(), soni, narx, "sayt: fayldan import");
            qoshildi++;
        }
        return new Natija(qoshildi, dublikat, otkazildi);
    }

    /** Sarlavha qatori bo'lsa ustunlar {nomi, narx, soni, firma, nomiRu, pachka}; bo'lmasa null. */
    private static int[] sarlavha(String[] q) {
        int nomi = -1, narx = -1, soni = -1, firma = -1, nomiRu = -1, pachka = -1;
        for (int c = 0; c < q.length; c++) {
            String h = q[c] == null ? "" : q[c].trim().toLowerCase(Locale.ROOT);
            if (h.isEmpty()) continue;
            if (pachka < 0 && (h.contains("pachka narx") || h.contains("pachka_narx") || h.contains("упаков"))) pachka = c;
            else if (nomiRu < 0 && (h.contains("ruscha") || h.contains("nomi_ru") || h.equals("rus"))) nomiRu = c;
            else if (nomi < 0 && (h.contains("nom") || h.contains("name") || h.contains("наимен") || h.contains("назв")
                    || h.contains("номи") || h.contains("товар") || h.contains("препарат"))) nomi = c;
            else if (narx < 0 && (h.contains("narx") || h.contains("нарх") || h.contains("цена") || h.contains("price"))) narx = c;
            else if (soni < 0 && (h.contains("soni") || h.contains("кол") || h.contains("qty") || h.contains("miqdor")
                    || h.contains("qoldiq") || h.contains("остат") || h.contains("сони"))) soni = c;
            else if (firma < 0 && (h.contains("ishlab") || h.contains("firma") || h.contains("производ")
                    || h.contains("manufacturer") || h.contains("изготов"))) firma = c;
        }
        if (nomi < 0 || narx < 0) return null;
        return new int[]{nomi, narx, soni, firma, nomiRu, pachka};
    }

    /** Excel (xlsx/xls) yoki matnli fayl (csv/txt: ";", tab yoki vergul bilan). */
    static List<String[]> oqi(byte[] data) throws IOException {
        if (data.length >= 4 && ((data[0] == 0x50 && data[1] == 0x4B) || (data[0] == (byte) 0xD0 && data[1] == (byte) 0xCF))) {
            List<String[]> rows = new ArrayList<>();
            try (Workbook wb = WorkbookFactory.create(new ByteArrayInputStream(data))) {
                Sheet sheet = wb.getSheetAt(0);
                for (Row row : sheet) {
                    String[] cells = new String[Math.max(3, row.getLastCellNum())];
                    boolean bosh = true;
                    for (int i = 0; i < cells.length; i++) {
                        cells[i] = katak(row.getCell(i));
                        if (!cells[i].isBlank()) bosh = false;
                    }
                    if (!bosh) rows.add(cells);
                }
            }
            return rows;
        }
        String matn = matn(data);
        List<String[]> rows = new ArrayList<>();
        for (String line : matn.split("\\r?\\n")) {
            line = line.trim();
            if (line.isEmpty()) continue;
            // «;» yoki tab bo'lsa o'sha, aks holda vergul — "12,5" kabi narx yoki nomdagi vergul qatorni buzmasin.
            String delim = line.contains(";") ? ";" : line.contains("\t") ? "\t" : ",";
            rows.add(line.split(delim, -1));
        }
        return rows;
    }

    /** Matnli fayl: UTF-8, bo'lmasa Windows-1251 (Excel'dan "CSV" saqlanganda shunday bo'ladi). */
    private static String matn(byte[] data) {
        int bosh = data.length >= 3 && data[0] == (byte) 0xEF && data[1] == (byte) 0xBB && data[2] == (byte) 0xBF ? 3 : 0;
        ByteBuffer buf = ByteBuffer.wrap(data, bosh, data.length - bosh);
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT).onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(buf).toString();
        } catch (CharacterCodingException e) {
            return new String(data, bosh, data.length - bosh, Charset.forName("windows-1251"));
        }
    }

    private static String katak(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> son(cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> switch (cell.getCachedFormulaResultType()) {
                case NUMERIC -> son(cell.getNumericCellValue());
                case STRING -> cell.getStringCellValue().trim();
                default -> "";
            };
            default -> "";
        };
    }

    private static String son(double v) {
        return v == Math.floor(v) && !Double.isInfinite(v) ? String.valueOf((long) v) : String.valueOf(v);
    }

    private static String ol(String[] q, int i) {
        return i >= 0 && i < q.length && q[i] != null ? q[i].trim() : "";
    }

    private static String boshBolsaNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static Double narx(String s) {
        if (s == null || s.isBlank()) return null;
        String t = s.replace(" ", "").replace(" ", "").replace(",", ".");
        try {
            double v = Double.parseDouble(t);
            return v >= 0 ? v : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Integer butunSon(String s) {
        if (s == null || s.isBlank()) return null;
        String t = s.replace(" ", "").replace(" ", "").replaceAll("[.,]0+$", "");
        try {
            int v = Integer.parseInt(t);
            return v >= 0 ? v : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Botdagi bilan bir xil: ortiqcha bo'shliq va qo'shtirnoqlar olib tashlanadi, butunlay KATTA harfdagi nom
     * odatiy ko'rinishga keltiriladi ("PARATSETAMOL 500MG" → "Paratsetamol 500mg").
     */
    static String tozaNom(String raw) {
        if (raw == null) return "";
        String s = raw.replace(' ', ' ').replaceAll("\\s+", " ").trim();
        while (s.length() >= 2 && (s.startsWith("\"") || s.startsWith("«")) && (s.endsWith("\"") || s.endsWith("»"))) {
            s = s.substring(1, s.length() - 1).trim();
        }
        boolean harf = false, kichik = false;
        for (char c : s.toCharArray()) {
            if (Character.isLetter(c)) {
                harf = true;
                if (Character.isLowerCase(c)) { kichik = true; break; }
            }
        }
        if (harf && !kichik && s.length() > 4) {
            String lower = s.toLowerCase(Locale.ROOT);
            int i = 0;
            while (i < lower.length() && !Character.isLetter(lower.charAt(i))) i++;
            s = i < lower.length() ? lower.substring(0, i) + Character.toUpperCase(lower.charAt(i)) + lower.substring(i + 1) : lower;
        }
        return s;
    }
}
