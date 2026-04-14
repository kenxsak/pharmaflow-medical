package com.pharmaflow.auth.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.UUID;

@Getter
@Setter
public class PharmaUserRequest {

    @NotBlank
    @Size(max = 100)
    private String username;

    @Size(max = 100)
    private String password;

    @NotBlank
    @Size(max = 200)
    private String fullName;

    @Size(max = 15)
    private String phone;

    @Size(max = 200)
    private String email;

    @NotBlank
    private String role;

    private UUID storeId;

    private UUID tenantId;

    private Boolean active;

    private Boolean platformOwner;

    @Size(max = 50)
    private String pharmacistRegNo;
}
