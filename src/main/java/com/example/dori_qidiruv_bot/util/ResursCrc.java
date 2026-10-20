package com.example.dori_qidiruv_bot.util;

import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.util.zip.CRC32;

/** Resurs fayl (TSV) o'zgarganini bilish uchun nazorat yig'indisi — fayl oqim bilan, xotiraga to'liq yuklanmay o'qiladi. */
public final class ResursCrc {

    private ResursCrc() { }

    public static String hisobla(String resurs) {
        try (InputStream in = new ClassPathResource(resurs).getInputStream()) {
            CRC32 crc = new CRC32();
            byte[] bufer = new byte[64 * 1024];
            int n;
            long uzunlik = 0;
            while ((n = in.read(bufer)) > 0) {
                crc.update(bufer, 0, n);
                uzunlik += n;
            }
            return Long.toHexString(crc.getValue()) + ":" + uzunlik;
        } catch (Exception e) {
            return null;
        }
    }
}
