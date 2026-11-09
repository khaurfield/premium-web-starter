package com.khaurfield.personalassistant;

import org.junit.Test;
import static org.junit.Assert.*;

public final class BackendOriginTest {
    @Test public void acceptsAndCanonicalizesHttpsOrigins() {
        assertEquals("https://assistant.example", BackendOrigin.parse(" https://ASSISTANT.example:443/ "));
        assertEquals("https://assistant.example:8443", BackendOrigin.parse("https://assistant.example:8443"));
    }

    @Test public void rejectsUnsafeOrInvalidInput() {
        assertNull(BackendOrigin.parse("http://assistant.example"));
        assertNull(BackendOrigin.parse("https://user:secret@assistant.example"));
        assertNull(BackendOrigin.parse("https://assistant.example/path"));
        assertNull(BackendOrigin.parse("https://assistant.example/?token=secret"));
        assertNull(BackendOrigin.parse("https://assistant.example/#fragment"));
        assertNull(BackendOrigin.parse("javascript:alert(1)"));
        assertNull(BackendOrigin.parse("https://assistant.example:99999"));
        assertNull(BackendOrigin.parse(null));
    }

    @Test public void onlyMatchesTheExactHttpsOrigin() {
        String origin = BackendOrigin.parse("https://assistant.example");
        assertTrue(BackendOrigin.matches(origin, "https://assistant.example/chat?x=1"));
        assertTrue(BackendOrigin.matches(origin, "https://ASSISTANT.example:443/documents"));
        assertFalse(BackendOrigin.matches(origin, "https://assistant.example.evil.test/chat"));
        assertFalse(BackendOrigin.matches(origin, "https://assistant.example:8443/chat"));
        assertFalse(BackendOrigin.matches(origin, "http://assistant.example/chat"));
        assertFalse(BackendOrigin.matches(origin, "https://user@assistant.example/chat"));
        assertFalse(BackendOrigin.matches(origin, "file:///data/local/test"));
        assertFalse(BackendOrigin.matches(origin, null));
    }
}
