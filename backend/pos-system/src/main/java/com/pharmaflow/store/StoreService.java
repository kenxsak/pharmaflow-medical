package com.pharmaflow.store;

import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaRoleName;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.store.dto.StoreResponse;
import com.pharmaflow.tenant.Tenant;
import com.pharmaflow.tenant.TenantAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final CurrentPharmaUserService currentPharmaUserService;
    private final TenantAccessService tenantAccessService;

    public List<StoreResponse> getActiveStores() {
        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        List<Store> stores = getAccessibleStoresForUser(currentUser);

        return stores
                .stream()
                .map(store -> StoreResponse.builder()
                        .storeId(store.getStoreId())
                        .storeCode(store.getStoreCode())
                        .storeName(store.getStoreName())
                        .storeType(store.getStoreType())
                        .tenantId(store.getTenant() != null ? store.getTenant().getTenantId() : null)
                        .tenantSlug(store.getTenant() != null ? store.getTenant().getSlug() : null)
                        .tenantName(store.getTenant() != null ? store.getTenant().getBrandName() : null)
                        .city(store.getCity())
                        .state(store.getState())
                        .gstin(store.getGstin())
                .build())
                .collect(Collectors.toList());
    }

    public List<Store> getAccessibleStoreEntities() {
        return getAccessibleStoresForUser(currentPharmaUserService.requireCurrentUser());
    }

    public Store requireAccessibleStore(UUID storeId) {
        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();

        return getAccessibleStoresForUser(currentUser)
                .stream()
                .filter(store -> store.getStoreId().equals(storeId))
                .findFirst()
                .orElseThrow(() -> new ForbiddenActionException("Selected store is not accessible for the current user"));
    }

    public List<Store> getAccessibleStoresForUser(PharmaUser currentUser) {
        if (currentUser.isPlatformOwner()) {
            return storeRepository.findAllByIsActiveTrueOrderByStoreNameAsc();
        }

        Tenant tenant = tenantAccessService.resolveTenantForUser(currentUser);
        if (hasTenantWideAccess(currentUser) || currentUser.getStore() == null) {
            return storeRepository.findAllByTenantTenantIdAndIsActiveTrueOrderByStoreNameAsc(tenant.getTenantId());
        }

        Store assignedStore = storeRepository.findByStoreIdAndTenantTenantId(
                        currentUser.getStore().getStoreId(),
                        tenant.getTenantId()
                )
                .filter(store -> Boolean.TRUE.equals(store.getIsActive()))
                .orElse(null);

        if (assignedStore != null) {
            return List.of(assignedStore);
        }

        throw new ForbiddenActionException("No active store is assigned to the current user");
    }

    public boolean hasTenantWideAccess(PharmaUser currentUser) {
        return currentUser.isPlatformOwner()
                || currentUser.hasRole(PharmaRoleName.SUPER_ADMIN)
                || currentUser.hasRole(PharmaRoleName.STORE_MANAGER);
    }
}
