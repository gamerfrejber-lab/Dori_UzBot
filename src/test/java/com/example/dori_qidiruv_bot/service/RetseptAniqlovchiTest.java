package com.example.dori_qidiruv_bot.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Retseptli dorilarni aniqlash: katalogdagi haqiqiy nom ko'rinishlari bilan. */
class RetseptAniqlovchiTest {

    private final KategoriyaAniqlovchi aniqlovchi = new KategoriyaAniqlovchi(new RetseptAniqlovchi());

    @ParameterizedTest
    @ValueSource(strings = {
            "ЦЕФТРИАКСОН 1,0Г ФЛ №1",
            "АМОКСИЦИЛЛИН 500МГ КАПС №10",
            "АМОКСИЦИЛЛИН ПОР Д/СУСП 125МГ/5МЛ 100МЛ",
            "ДИКЛОФЕНАК SD ТАБ 25МГ №20",
            "ДИКЛОФЕНАК АМП 25МГ/МЛ 3МЛ №10",
            "ЦИАНОКОБАЛАМИН АМП 0,05% 1МЛ №10",
            "МЕТРОНИДАЗОЛ Р-Р Д/ИНФ 100МЛ",
            "НАТРИЯ ХЛОРИД Р-Р Д/ИНФ 0,9% 200МЛ",
            "ПРЕДНИЗОЛОН АМП 30МГ/МЛ 1МЛ №10",
            "МЕТИЛПРЕДНИЗОЛОН-ФС ТАБ 4МГ №30",
            "АМЛОДИПИН ТАБ 5МГ №30",
            "ИНСУЛИН АКТРАПИД НМ 100 ЕД/МЛ 10МЛ",
            "L-ТИРОКСИН 50 ТАБ №100",
            "ЛЕВОМИЦЕТИН-АТМ КАПС 250МГ №20",
            "РЕГУЛОН ТАБ №21",
            "ТРАМАДОЛ КАПС 50МГ №20",
    })
    void retseptli(String nomi) {
        assertTrue(aniqlovchi.retseptlimi(nomi, null), nomi);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "ПАРАЦЕТАМОЛ ТАБ 500МГ №10",
            "ИБУПРОФЕН ТАБ 200МГ №20",
            "НУРОФЕН ДЕТСКИЙ СУСП 100МГ/5МЛ 100МЛ",
            "ДИКЛОФЕНАК-RG ГЕЛЬ 1% 25Г",
            "ВОЛЬТАРЕН ЭМУЛЬГЕЛЬ 1% 50Г",
            "МЕТРОНИДАЗОЛ ГЕЛЬ 20Г",
            "ТЕТРАЦИКЛИН МАЗЬ 3% 15Г",
            "ВИТАМИН B-12 (ЦИАНОКОБАЛАМИН) 250МГ  ТАБ №60",
            "ЦЕФЕКОН Д СУПП 100МГ №10",
            "ШПРИЦ 5МЛ 3-Х КОМП",
            "СИСТЕМА ДЛЯ ИНФУЗИЙ",
            "ЛОРАТАДИН ТАБ 10МГ №10",
            "СМЕКТА ПОР 3Г №10",
            "КАРДИОМАГНИЛ ТАБ 75МГ №30",
    })
    void retseptsiz(String nomi) {
        assertFalse(aniqlovchi.retseptlimi(nomi, null), nomi);
    }

    @Test
    void kategoriyaUstunigaQoshiladi() {
        assertEquals(",antibiotiklar,retseptli,", aniqlovchi.aniqla("АМОКСИЦИЛЛИН 500МГ КАПС №10", null));
        assertEquals(",bosh-ogriq,", aniqlovchi.aniqla("ПАРАЦЕТАМОЛ ТАБ 500МГ №10", null));
        // Faqat "+bolalar" mos kelgan (asosiy kategoriyasi yo'q) nom ham xatosiz ishlaydi.
        assertFalse(aniqlovchi.aniqla("СОСКА ДЕТСКАЯ", null).contains("retseptli"));
    }
}
