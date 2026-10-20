package com.example.dori_qidiruv_bot.util;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Dori nomidan "asosiy nom"ni ajratadi: shakl, doza va o'ram olib tashlanadi.
 * "ПАНТАП ТАБ 40МГ №28" va "ПАНТАП ТАБ 20МГ №28" → "ПАНТАП" — bir doriga bitta yo'riqnoma yoziladi.
 */
public final class DoriKalit {

    private DoriKalit() { }

    /** Shakl so'zlari: shu so'zdan keyingi qism (shakl, doza, o'ram) nomga kirmaydi. */
    private static final Set<String> SHAKL = Set.of(
            "ТАБ", "ТАБЛ", "ТАБЛЕТКИ", "ДРАЖЕ", "КАПС", "КАПСУЛЫ", "ПАСТ", "ПАСТИЛКИ", "ЛЕДЕНЦЫ",
            "СИРОП", "СУСП", "СУСПЕНЗИЯ", "КАПЛИ", "ГЛ/КАПЛИ", "УШ/КАПЛИ", "НАЗ/КАПЛИ",
            "АМП", "АМПУЛЫ", "ФЛ", "ЛИОФ", "РАСТВОР", "МАЗЬ", "ГЛ/МАЗЬ", "ГЕЛЬ", "КРЕМ", "ЛИНИМЕНТ",
            "СУПП", "СВЕЧИ", "СПРЕЙ", "АЭР", "АЭРОЗОЛЬ", "ИНГ", "ПОР", "ПОРОШОК", "ПАК", "САШЕ",
            "ГРАН", "ГРАНУЛЫ", "ЭМУЛЬСИЯ", "НАСТОЙКА", "ЭЛИКСИР", "КОНЦ");

    /** Raqam, "№", "Д/..." yoki "Р-Р" bilan boshlangan so'zdan keyin ham nom tugaydi. */
    private static final Pattern TOXTA = Pattern.compile("^(№|\\d|Д/|Р-Р).*");
    private static final Pattern QAVS = Pattern.compile("[(\\[].*?[)\\]]");

    /** Dori bo'lmagan mahsulotlar (kosmetika, gigiyena, oziq-ovqat, buyumlar) — ularga yo'riqnoma yozilmaydi. */
    private static final Pattern DORI_EMAS = Pattern.compile(
            "(?<![А-ЯA-Z])(ЗУБН|ШАМПУН|ПОДГУЗ|ПАМПЕРС|ТРУСИКИ|СМЕСЬ|ВОДА ПРИР|НАПИТОК|НИПИТОК|ПОМАДА|ЛОСЬОН"
                    + "|ПУСТЫШК|СОСКА|БУТЫЛОЧК|ПРОРЕЗЫВ|ПЕРЧАТК|ПРЕЗЕРВАТИВ|ПРОКЛАДК|ТАМПОН|САЛФЕТК|ПОЯС|БАНДАЖ"
                    + "|КОРСЕТ|НАЛОКОТ|НАКОЛЕН|ГЕТРЫ|ЧУЛКИ|ПОДУШК|ШПРИЦ|ИГЛЫ|ИГЛА|БИНТ|ВАТА|ТЕРМОМЕТР|ТОНОМЕТР"
                    + "|ГЛЮКОМЕТР|ТЕСТ-ПОЛОС|КОНФЕТ|ЛРП|УРЬЯЖ|ЛОРЕАЛЬ|NIVEA|ДЕЗОДОРАНТ|АНТИПЕРСПИР|МЫЛО|СКРАБ"
                    + "|ДЕПИЛЯЦ|ЩЕТКА|ОСВЕЖИТЕЛ|ЗЕРКАЛО|ШОРТЫ|МАЙКА|ПЕЛЕНК|ЗАКУСКА|ПЕЧЕНЬЕ|БАТОНЧИК|ПЮРЕ"
                    + "|ПЛАСТЫРЬ|ЛЕЙКОПЛАСТЫРЬ|КАТЕТЕР|СИСТЕМА Д/|МАСКА)");

    public static String kalit(String nomi) {
        if (nomi == null) return "";
        String s = QAVS.matcher(nomi.toUpperCase(Locale.ROOT).replace('Ё', 'Е')).replaceAll(" ")
                .replace('"', ' ').replace('\'', ' ').replace('«', ' ').replace('»', ' ');
        String[] sozlar = s.trim().split("\\s+");
        StringBuilder nom = new StringBuilder();
        for (String soz : sozlar) {
            String t = soz.replaceAll("^[.,;*]+|[.,;*]+$", "");
            if (t.isEmpty()) continue;
            if (SHAKL.contains(t) || TOXTA.matcher(t).matches()) break;
            if (!nom.isEmpty()) nom.append(' ');
            nom.append(t);
        }
        String natija = nom.toString().replaceAll("^[\\s-]+|[\\s-]+$", "");
        if (natija.isEmpty()) natija = sozlar.length > 0 ? sozlar[0] : "";
        return natija.length() > 300 ? natija.substring(0, 300) : natija;
    }

    public static boolean doriEmasmi(String kalit) {
        return DORI_EMAS.matcher(" " + kalit + " ").find();
    }
}
