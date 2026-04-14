package com.pharmaflow.auth;

import com.pharmaflow.auth.dto.PharmaRoleOptionResponse;
import com.pharmaflow.auth.dto.PharmaUserRequest;
import com.pharmaflow.auth.dto.PharmaUserResponse;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import com.pharmaflow.tenant.Tenant;
import com.pharmaflow.tenant.TenantAccessService;
import com.pharmaflow.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PharmaUserManagementService {

    private final PharmaUserRepository pharmaUserRepository;
    private final RoleRepository roleRepository;
    private final StoreRepository storeRepository;
    private final TenantRepository tenantRepository;
    private final CurrentPharmaUserService currentPharmaUserService;
    private final TenantAccessService tenantAccessService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<PharmaUserResponse> listUsers(String query) {
        PharmaUser currentUser = requireUserManager();
        Tenant scopeTenant = currentUser.isPlatformOwner() ? null : tenantAccessService.resolveTenantForUser(currentUser);
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);

        return pharmaUserRepository.findAll()
                .stream()
                .filter(user -> scopeTenant == null
                        || (user.getTenant() != null && scopeTenant.getTenantId().equals(user.getTenant().getTenantId())))
                .filter(user -> matchesQuery(user, normalizedQuery))
                .sorted(Comparator
                        .comparing((PharmaUser user) -> user.getFullName() == null ? "" : user.getFullName(), String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(user -> user.getUsername() == null ? "" : user.getUsername(), String.CASE_INSENSITIVE_ORDER))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PharmaRoleOptionResponse> listRoles() {
        PharmaUser currentUser = requireUserManager();

        return roleRepository.findAll()
                .stream()
                .filter(role -> currentUser.isPlatformOwner() || role.getRoleName() != PharmaRoleName.SUPER_ADMIN)
                .sorted(Comparator.comparing(role -> role.getRoleName().name()))
                .map(this::toRoleOption)
                .collect(Collectors.toList());
    }

    @Transactional
    public PharmaUserResponse createUser(PharmaUserRequest request) {
        PharmaUser currentUser = requireUserManager();

        pharmaUserRepository.findByUsername(request.getUsername().trim())
                .ifPresent(existing -> {
                    throw new BusinessRuleException("Username is already in use");
                });

        PharmaUser user = PharmaUser.builder().build();
        applyRequest(user, request, currentUser, true);
        return toResponse(pharmaUserRepository.save(user));
    }

    @Transactional
    public PharmaUserResponse updateUser(UUID userId, PharmaUserRequest request) {
        PharmaUser currentUser = requireUserManager();
        PharmaUser user = pharmaUserRepository.findById(userId)
                .orElseThrow(() -> new BusinessRuleException("User not found"));

        ensureVisibleToCurrentUser(currentUser, user);

        pharmaUserRepository.findByUsername(request.getUsername().trim())
                .filter(existing -> !existing.getUserId().equals(userId))
                .ifPresent(existing -> {
                    throw new BusinessRuleException("Username is already in use");
                });

        applyRequest(user, request, currentUser, false);
        return toResponse(pharmaUserRepository.save(user));
    }

    private void applyRequest(PharmaUser user, PharmaUserRequest request, PharmaUser currentUser, boolean creating) {
        PharmaRoleName requestedRoleName = parseRole(request.getRole());
        RoleEntity role = roleRepository.findByRoleName(requestedRoleName)
                .orElseThrow(() -> new BusinessRuleException("Requested role was not found"));

        if (!currentUser.isPlatformOwner() && requestedRoleName == PharmaRoleName.SUPER_ADMIN) {
            throw new ForbiddenActionException("Only the SaaS admin can assign the SUPER_ADMIN role");
        }

        boolean requestedPlatformOwner = Boolean.TRUE.equals(request.getPlatformOwner());
        if (requestedPlatformOwner && !currentUser.isPlatformOwner()) {
            throw new ForbiddenActionException("Only the SaaS admin can grant platform ownership");
        }

        Tenant tenant = resolveTargetTenant(currentUser, request, user);
        Store store = resolveTargetStore(tenant, request.getStoreId(), user.getStore());

        if (requestedRoleName != PharmaRoleName.SUPER_ADMIN && store == null) {
            throw new BusinessRuleException("A store must be selected for company and store users");
        }

        if (creating && (request.getPassword() == null || request.getPassword().isBlank())) {
            throw new BusinessRuleException("Password is required when creating a user");
        }

        user.setUsername(request.getUsername().trim());
        user.setFullName(request.getFullName().trim());
        user.setPhone(trimToNull(request.getPhone()));
        user.setEmail(trimToNull(request.getEmail()));
        user.setRole(role);
        user.setTenant(tenant);
        user.setStore(store);
        user.setIsActive(request.getActive() == null || request.getActive());
        user.setIsPlatformOwner(requestedPlatformOwner);
        user.setPharmacistRegNo(trimToNull(request.getPharmacistRegNo()));

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
        }
    }

    private PharmaUser requireUserManager() {
        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        if (!currentUser.isPlatformOwner()
                && !currentUser.hasRole(PharmaRoleName.STORE_MANAGER)
                && !currentUser.hasRole(PharmaRoleName.SUPER_ADMIN)) {
            throw new ForbiddenActionException("User and permissions management requires SaaS admin or company admin access");
        }
        return currentUser;
    }

    private void ensureVisibleToCurrentUser(PharmaUser currentUser, PharmaUser targetUser) {
        if (currentUser.isPlatformOwner()) {
            return;
        }

        Tenant currentTenant = tenantAccessService.resolveTenantForUser(currentUser);
        UUID targetTenantId = targetUser.getTenant() != null ? targetUser.getTenant().getTenantId() : null;
        if (targetTenantId == null || !currentTenant.getTenantId().equals(targetTenantId)) {
            throw new ForbiddenActionException("You can only manage users in your own company");
        }
    }

    private Tenant resolveTargetTenant(PharmaUser currentUser, PharmaUserRequest request, PharmaUser existingUser) {
        if (!currentUser.isPlatformOwner()) {
            return tenantAccessService.resolveTenantForUser(currentUser);
        }

        if (request.getTenantId() != null) {
            return tenantRepository.findById(request.getTenantId())
                    .orElseThrow(() -> new BusinessRuleException("Selected tenant was not found"));
        }

        if (request.getStoreId() != null) {
            Store store = storeRepository.findByStoreId(request.getStoreId())
                    .orElseThrow(() -> new BusinessRuleException("Selected store was not found"));
            if (store.getTenant() != null) {
                return store.getTenant();
            }
        }

        if (existingUser.getTenant() != null) {
            return existingUser.getTenant();
        }

        return tenantAccessService.resolveTenantForUser(currentUser);
    }

    private Store resolveTargetStore(Tenant tenant, UUID storeId, Store existingStore) {
        if (storeId != null) {
            return storeRepository.findByStoreIdAndTenantTenantId(storeId, tenant.getTenantId())
                    .orElseThrow(() -> new BusinessRuleException("Selected store does not belong to the chosen tenant"));
        }

        if (existingStore != null
                && existingStore.getTenant() != null
                && tenant.getTenantId().equals(existingStore.getTenant().getTenantId())) {
            return existingStore;
        }

        return null;
    }

    private boolean matchesQuery(PharmaUser user, String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) {
            return true;
        }

        String haystack = String.join(" ",
                safe(user.getUsername()),
                safe(user.getFullName()),
                safe(user.getPhone()),
                safe(user.getEmail()),
                user.getRole() != null && user.getRole().getRoleName() != null ? user.getRole().getRoleName().name() : "",
                user.getStore() != null ? safe(user.getStore().getStoreCode()) : "",
                user.getStore() != null ? safe(user.getStore().getStoreName()) : "",
                user.getTenant() != null ? safe(user.getTenant().getSlug()) : "",
                user.getTenant() != null ? safe(user.getTenant().getBrandName()) : ""
        ).toLowerCase(Locale.ROOT);

        return haystack.contains(normalizedQuery);
    }

    private PharmaRoleName parseRole(String role) {
        try {
            return PharmaRoleName.valueOf(role.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new BusinessRuleException("Unsupported role supplied");
        }
    }

    private PharmaRoleOptionResponse toRoleOption(RoleEntity role) {
        return PharmaRoleOptionResponse.builder()
                .role(role.getRoleName().name())
                .label(toLabel(role.getRoleName().name()))
                .description(role.getDescription())
                .canEditPrice(Boolean.TRUE.equals(role.getCanEditPrice()))
                .canEditBills(Boolean.TRUE.equals(role.getCanEditBills()))
                .canSellScheduleH(Boolean.TRUE.equals(role.getCanSellScheduleH()))
                .canViewReports(Boolean.TRUE.equals(role.getCanViewReports()))
                .canManageInventory(Boolean.TRUE.equals(role.getCanManageInventory()))
                .build();
    }

    private PharmaUserResponse toResponse(PharmaUser user) {
        RoleEntity role = user.getRole();
        return PharmaUserResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .role(role != null && role.getRoleName() != null ? role.getRoleName().name() : null)
                .roleLabel(role != null && role.getRoleName() != null ? toLabel(role.getRoleName().name()) : null)
                .roleDescription(role != null ? role.getDescription() : null)
                .storeId(user.getStore() != null ? user.getStore().getStoreId() : null)
                .storeCode(user.getStore() != null ? user.getStore().getStoreCode() : null)
                .storeName(user.getStore() != null ? user.getStore().getStoreName() : null)
                .tenantId(user.getTenant() != null ? user.getTenant().getTenantId() : null)
                .tenantSlug(user.getTenant() != null ? user.getTenant().getSlug() : null)
                .tenantName(user.getTenant() != null ? user.getTenant().getBrandName() : null)
                .active(user.getIsActive())
                .platformOwner(user.isPlatformOwner())
                .pharmacistRegNo(user.getPharmacistRegNo())
                .canEditPrice(role != null ? role.getCanEditPrice() : Boolean.FALSE)
                .canEditBills(role != null ? role.getCanEditBills() : Boolean.FALSE)
                .canSellScheduleH(role != null ? role.getCanSellScheduleH() : Boolean.FALSE)
                .canViewReports(role != null ? role.getCanViewReports() : Boolean.FALSE)
                .canManageInventory(role != null ? role.getCanManageInventory() : Boolean.FALSE)
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String toLabel(String enumName) {
        return Arrays.stream(enumName.split("_"))
                .filter(token -> !token.isBlank())
                .map(token -> token.substring(0, 1) + token.substring(1).toLowerCase(Locale.ROOT))
                .collect(Collectors.joining(" "));
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
