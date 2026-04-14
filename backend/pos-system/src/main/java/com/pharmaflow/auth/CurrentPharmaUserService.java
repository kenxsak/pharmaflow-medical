package com.pharmaflow.auth;

import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class CurrentPharmaUserService {

    private final PharmaUserRepository pharmaUserRepository;
    private final TenantRepository tenantRepository;

    public PharmaUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return null;
        }

        String tenantSlug = resolveTenantSlugFromRequest();
        if (tenantSlug != null) {
            PharmaUser scopedUser = tenantRepository.findBySlug(tenantSlug)
                    .flatMap(tenant -> pharmaUserRepository.findByUsernameAndTenantTenantId(
                            authentication.getName(),
                            tenant.getTenantId()
                    ))
                    .orElse(null);
            if (scopedUser != null) {
                return scopedUser;
            }
        }

        return pharmaUserRepository.findByUsername(authentication.getName()).orElse(null);
    }

    public PharmaUser requireCurrentUser() {
        PharmaUser user = getCurrentUser();
        if (user == null) {
            throw new ForbiddenActionException("Authenticated PharmaFlow user is required");
        }
        return user;
    }

    private String resolveTenantSlugFromRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null || attributes.getRequest() == null) {
            return null;
        }

        String tenantSlug = attributes.getRequest().getHeader("X-Tenant-Slug");
        if (tenantSlug == null || tenantSlug.isBlank()) {
            tenantSlug = attributes.getRequest().getParameter("tenantSlug");
        }

        if (tenantSlug == null || tenantSlug.isBlank()) {
            return null;
        }

        return tenantSlug.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
