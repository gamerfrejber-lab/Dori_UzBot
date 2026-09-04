package com.example.dori_qidiruv_bot.service;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class KatalogNameUpdaterTest {
    @Test
    void updatesEverySourceRowWithoutChangingIdentityOrSupplier() throws Exception {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        AtomicInteger rows = new AtomicInteger();
        when(jdbc.batchUpdate(anyString(), org.mockito.ArgumentMatchers.<List<Object[]>>any()))
                .thenAnswer(call -> {
                    String sql = call.getArgument(0);
                    assertTrue(sql.startsWith("UPDATE dori_katalog SET nomi_ru = ?, nomi_uz = ?"));
                    assertTrue(sql.contains("WHERE nomi = ?"));
                    assertTrue(sql.contains("COALESCE(ishlab_chiqaruvchi, '') = ?"));
                    assertTrue(sql.contains("IS DISTINCT FROM"));
                    List<Object[]> batch = call.getArgument(1);
                    assertTrue(batch.size() <= 1000);
                    for (Object[] row : batch) {
                        assertEquals(7, row.length);
                        assertFalse(((String) row[0]).isBlank());
                        assertFalse(((String) row[1]).isBlank());
                        assertEquals(row[0], row[5]);
                        assertEquals(row[1], row[6]);
                    }
                    rows.addAndGet(batch.size());
                    return new int[batch.size()];
                });
        new KatalogNameUpdater(jdbc).run();
        assertEquals(26357, rows.get());
        verify(jdbc, times(27)).batchUpdate(anyString(), org.mockito.ArgumentMatchers.<List<Object[]>>any());
    }
}
