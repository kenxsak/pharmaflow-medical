package com.pharmaflow.auth.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;

@Getter
@Setter
public class AuthRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    private String tenantSlug;
}
