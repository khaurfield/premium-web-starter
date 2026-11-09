package com.khaurfield.personalassistant;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

/** An HTTPS origin supplied by the user; no credentials, path, or secret values. */
final class BackendOrigin {
    private BackendOrigin() { }

    static String parse(String input) {
        if (input == null) return null;
        try {
            URI uri = new URI(input.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                    || uri.getUserInfo() != null || uri.getRawQuery() != null
                    || uri.getRawFragment() != null) return null;
            String path = uri.getRawPath();
            if (path != null && !path.isEmpty() && !"/".equals(path)) return null;
            int port = uri.getPort();
            if (port == 0 || port > 65535) return null;
            String host = uri.getHost().toLowerCase(Locale.ROOT);
            // Java's URI returns IPv6 literals already enclosed in brackets.
            if (!host.matches("[a-z0-9.\\-]+") && !host.matches("\\[[a-f0-9:]+\\]")) return null;
            return "https://" + host + (port == -1 || port == 443 ? "" : ":" + port);
        } catch (URISyntaxException | IllegalArgumentException ex) {
            return null;
        }
    }

    static boolean matches(String origin, String target) {
        if (origin == null || target == null) return false;
        try {
            URI u = new URI(target);
            if (!"https".equalsIgnoreCase(u.getScheme()) || u.getHost() == null || u.getUserInfo() != null) return false;
            String candidate = "https://" + u.getHost().toLowerCase(Locale.ROOT);
            int port = u.getPort();
            if (port == 0 || port > 65535) return false;
            if (port != -1 && port != 443) candidate += ":" + port;
            return origin.equals(candidate);
        } catch (URISyntaxException | IllegalArgumentException ex) {
            return false;
        }
    }
}
