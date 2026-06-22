package com.gongmodoc.dto;

import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record LoginRequest(@NotBlank String accessCode, @NotBlank String nickname) {
    }

    public record LoginResponse(boolean success, String nickname, String token) {
    }
}
