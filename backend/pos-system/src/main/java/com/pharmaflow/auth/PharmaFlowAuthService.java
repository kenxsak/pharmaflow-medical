package com.pharmaflow.auth;

import com.lifepill.possystem.config.JwtService;
import com.pharmaflow.auth.dto.AuthRequest;
import com.pharmaflow.auth.dto.AuthResponse;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import com.pharmaflow.tenant.Tenant;
import com.pharmaflow.tenant.TenantAccessService;
import com.pharmaflow.tenant.TenantRepository;
import com.pharmaflow.tenant.TenantSubscription;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PharmaFlowAuthService {

    private final PharmaUserRepository pharmaUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final StoreRepository storeRepository;
    private final TenantAccessService tenantAccessService;
    private final TenantRepository tenantRepository;

    @Transactional
    public AuthResponse login(AuthRequest request) {
        PharmaUser user = resolveUserForLogin(request);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        user.setLastLogin(LocalDateTime.now());
        pharmaUserRepository.save(user);

        Store preferredStore = resolvePreferredStore(user);
        Tenant tenant = tenantAccessService.resolveTenantForUser(user);
        TenantSubscription subscription = tenantAccessService.requireActiveSubscription(tenant);

        return AuthResponse.builder()
                .token(jwtService.generateToken(
                        user,
                        buildAuthClaims(tenant, subscription, user),
                        tenant.getSlug() + "|" + user.getUsername()
                ))
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole() != null && user.getRole().getRoleName() != null
                        ? user.getRole().getRoleName().name()
                        : null)
                .storeId(preferredStore != null ? preferredStore.getStoreId() : null)
                .storeCode(preferredStore != null ? preferredStore.getStoreCode() : null)
                .tenantId(tenant.getTenantId())
                .tenantSlug(tenant.getSlug())
                .brandName(tenant.getBrandName())
                .brandTagline(tenant.getBrandTagline())
                .supportEmail(tenant.getSupportEmail())
                .supportPhone(tenant.getSupportPhone())
                .deploymentMode(tenant.getDeploymentMode())
                .subscriptionPlanCode(subscription.getPlan() != null ? subscription.getPlan().getPlanCode() : null)
                .subscriptionPlanName(subscription.getPlan() != null ? subscription.getPlan().getName() : null)
                .platformOwner(user.isPlatformOwner())
                .build();
    }

    private PharmaUser resolveUserForLogin(AuthRequest request) {
        String username = request.getUsername().trim();

        if (request.getTenantSlug() != null && !request.getTenantSlug().isBlank()) {
            Tenant tenant = tenantRepository.findBySlug(request.getTenantSlug().trim().toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new BadCredentialsException("Invalid tenant, username or password"));

            return pharmaUserRepository.findByUsernameAndTenantTenantId(username, tenant.getTenantId())
                    .orElseThrow(() -> new BadCredentialsException("Invalid tenant, username or password"));
        }

        return pharmaUserRepository.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));
    }

    private Map<String, Object> buildAuthClaims(Tenant tenant, TenantSubscription subscription, PharmaUser user) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("tenantId", tenant.getTenantId().toString());
        claims.put("tenantSlug", tenant.getSlug());
        claims.put("platformOwner", user.isPlatformOwner());
        if (subscription.getPlan() != null) {
            claims.put("subscriptionPlanCode", subscription.getPlan().getPlanCode());
        }
        return claims;
    }

    private Store resolvePreferredStore(PharmaUser user) {
        if (user.getStore() != null && "STORE".equalsIgnoreCase(user.getStore().getStoreType())) {
            return user.getStore();
        }

        if (user.getTenant() != null) {
            return storeRepository.findFirstByTenantTenantIdAndStoreTypeIgnoreCaseAndIsActiveTrueOrderByStoreNameAsc(
                            user.getTenant().getTenantId(),
                            "STORE"
                    )
                    .orElse(null);
        }

        return storeRepository.findByStoreCode("TN-STORE-001")
                .or(() -> storeRepository.findFirstByStoreTypeIgnoreCaseAndIsActiveTrueOrderByStoreNameAsc("STORE"))
                .orElse(user.getStore());
    }
}
