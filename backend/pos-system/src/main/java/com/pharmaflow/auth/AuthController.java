package com.pharmaflow.auth;

import com.pharmaflow.auth.dto.AuthRequest;
import com.pharmaflow.auth.dto.AuthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController("pharmaFlowAuthController")
@Validated
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final PharmaFlowAuthService pharmaFlowAuthService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        return pharmaFlowAuthService.login(request);
    }
}
