package com.gongmodoc.service;

import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    public static final String AUTH_HEADER = "X-GongmoDoc-Token";
    private static final Set<String> ALLOWED_NICKNAMES = Set.of("지은", "영연");

    private final String accessCode;
    private final String token;

    public AuthService(@Value("${app.access-code}") String accessCode) {
        this.accessCode = accessCode;
        this.token = sha256("gongmodoc:" + accessCode);
    }

    public String login(String submittedCode, String nickname) {
        if (!accessCode.equals(submittedCode) || nickname == null || nickname.isBlank()) {
            throw new IllegalArgumentException("비밀번호 또는 아이디를 확인해주세요.");
        }
        if (!ALLOWED_NICKNAMES.contains(nickname.trim())) {
            throw new IllegalArgumentException("아이디는 지은 또는 영연만 사용할 수 있습니다.");
        }
        return token;
    }

    public boolean isValidToken(String submittedToken) {
        return token.equals(submittedToken);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encoded = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte b : encoded) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}
