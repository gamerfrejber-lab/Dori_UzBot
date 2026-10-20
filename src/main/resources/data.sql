-- Karta raqami environment variable orqali boshqariladi, hardcode qilinmaydi.
-- Bu fayl har ishga tushishda bajariladi, shuning uchun har bir buyruq takror bajarilganda ham
-- hech narsani buzmasligi (idempotent) kerak.
-- Qidiruv indekslari endi IndeksYaratuvchi.java'da (CONCURRENTLY — jadval qulflanmaydi).

-- Asosiy dorixona: baza yangi bo'lsa (hosting ko'chirilganda) qayta yaratiladi.
-- Mavjud bo'lsa tegilmaydi.
INSERT INTO dorixona (nomi, manzil, ish_boshlanishi, ish_tugashi)
SELECT 'Vazira Pharm', 'Yunusobod 11-chi kvartal', '08:00', '22:00'
WHERE NOT EXISTS (SELECT 1 FROM dorixona WHERE nomi ILIKE '%Vazira%');

-- Dorixona ish vaqtlari (agar hali o'rnatilmagan bo'lsa).
UPDATE dorixona SET ish_boshlanishi = '08:00', ish_tugashi = '22:00'
WHERE ish_boshlanishi IS NULL AND nomi ILIKE '%Vazira%';

-- Eslatma: avval bu yerda "Vazira" dorixonasining nomi va manzili har ishga tushishda qayta yozilardi —
-- paneldan kiritilgan manzil restartdan keyin o'chib ketardi. Bu buyruq olib tashlandi.
