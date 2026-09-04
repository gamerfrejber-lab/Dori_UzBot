# Katalog nomlari

26357 manba yozuvi qayta ishlangan. Asl dori_katalog.tsv o‘zgarmagan.
Ruscha o‘qiladigan nom va o‘zbekcha transliteratsiya/tarjima alohida nomiRu va nomiUz maydonlarida.
Doza, sonlar, o‘nlik ajratgich va qadoq belgilari saqlangan; biror mahsulot birlashtirilmagan yoki o‘chirilmagan.

## Chegaralar

Bu avtomatik formatlash va atamalar lug‘ati asosidagi tahrir. Barcha savdo nomlari rasmiy reyestrga bittalab solishtirilmagan.
3569 yozuvda qo‘shimcha tekshirish belgisi bor (catalog-names-review.tsv).
Belgilanmagan yozuvlar ham savdo nomi imlosi tasdiqlangan degani emas. Lug‘atda bo‘lmagan ruscha tavsiflar o‘zbekchada hozircha transliteratsiya qilinadi.
Shubhali nom, boshlang‘ich 0, yulduzcha, qavs yoki doza taxmin bilan tuzatilmagan.

## Qayta yaratish

Loyiha ildizida: node scripts/catalog-names.mjs
Hisobot: catalog-name-audit.tsv. Qoidalar: scripts/catalog-names.mjs.

## Ishga tushirish

Ilovaning yangilangan versiyasi ishga tushganda Hibernate mavjud update sozlamasi bilan nomi_ru/nomi_uz ustunlarini qo‘shadi.
KatalogNameUpdater manbadagi nom + ishlab chiqaruvchi + davlat bo‘yicha mavjud qatorlarga moslaydi.
Asl nomlar, ID, narx va ombor o‘zgarmaydi. Yangilash tranzaksiyada va takroriy ishga tushishga mos.
Katalogdan admin panelda tanlanganda ikkala til maydoni alohida to‘ldiriladi.
Eski dorixona omboridagi qo‘lda kiritilgan nomlar bu katalog yangilanishiga kirmaydi.
Bu ish davomida ishlab turgan server yoki haqiqiy baza yangilanmagan.

## Manba namunasi

Ruscha nom tuzilishiga misol: https://uzpharm-control.uz/ru/registries/certified-medicines/view/831470
Bu bitta namuna, butun katalogning tasdiqlanganligi haqidagi da’vo emas.
