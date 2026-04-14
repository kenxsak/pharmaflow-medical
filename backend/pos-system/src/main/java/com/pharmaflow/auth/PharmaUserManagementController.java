package com.pharmaflow.auth;

import com.pharmaflow.auth.dto.PharmaRoleOptionResponse;
import com.pharmaflow.auth.dto.PharmaUserRequest;
import com.pharmaflow.auth.dto.PharmaUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@Validated
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class PharmaUserManagementController {

    private final PharmaUserManagementService pharmaUserManagementService;

    @GetMapping
    public List<PharmaUserResponse> listUsers(
            @RequestParam(required = false) String query
    ) {
        return pharmaUserManagementService.listUsers(query);
    }

    @GetMapping("/roles")
    public List<PharmaRoleOptionResponse> listRoles() {
        return pharmaUserManagementService.listRoles();
    }

    @PostMapping
    public PharmaUserResponse createUser(@Valid @RequestBody PharmaUserRequest request) {
        return pharmaUserManagementService.createUser(request);
    }

    @PutMapping("/{userId}")
    public PharmaUserResponse updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody PharmaUserRequest request
    ) {
        return pharmaUserManagementService.updateUser(userId, request);
    }
}
