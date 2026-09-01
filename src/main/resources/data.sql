-- Karta raqami environment variable orqali boshqariladi, hardcode qilinmaydi.

-- pg_trgm: LIKE '%...%' qidiruvni tezlashtiruvchi GIN indekslar.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS dori_nomi_trgm_idx ON dori USING gin (nomi gin_trgm_ops);
CREATE INDEX IF NOT EXISTS dori_nomi_ru_trgm_idx ON dori USING gin (nomi_ru gin_trgm_ops);

-- Dori katalog (26k qator) uchun trigram indekslar.
CREATE INDEX IF NOT EXISTS dori_katalog_nomi_trgm_idx ON dori_katalog USING gin (nomi gin_trgm_ops);
CREATE INDEX IF NOT EXISTS dori_katalog_ishlab_trgm_idx ON dori_katalog USING gin (ishlab_chiqaruvchi gin_trgm_ops);

-- Telefon raqami bo'yicha tez qidiruv (regexp_replace funksional indeks).
CREATE INDEX IF NOT EXISTS bot_user_phone_digits_idx
    ON bot_user (regexp_replace(phone, '[^0-9]', '', 'g'));

-- Dorixona ish vaqtlari (agar hali o'rnatilmagan bo'lsa).
UPDATE dorixona SET ish_boshlanishi = '08:00', ish_tugashi = '22:00'
WHERE ish_boshlanishi IS NULL AND nomi ILIKE '%Vazira%';
