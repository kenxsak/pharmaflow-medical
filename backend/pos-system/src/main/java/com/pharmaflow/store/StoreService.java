package com.pharmaflow.store;

import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.store.dto.StoreResponse;
import com.pharmaflow.tenant.Tenant;
import com.pharmaflow.tenant.TenantAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final CurrentPharmaUserService currentPharmaUserService;
    private final TenantAccessService tenantAccessService;

    public List<StoreResponse> getActiveStores() {
        PharmaUser currentUser = currentPharmaUserService.requireCurrentUser();
        List<Store> stores;

        if (currentUser.isPlatformOwner()) {
            stores = storeRepository.findAllByIsActiveTrueOrderByStoreNameAsc();
        } else {
            Tenant tenant = tenantAccessService.resolveTenantForUser(currentUser);
            stores = storeRepository.findAllByTenantTenantIdAndIsActiveTrueOrderByStoreNameAsc(tenant.getTenantId());
        }

        return stores
                .stream()
                .map(store -> StoreResponse.builder()
                        .storeId(store.getStoreId())
                        .storeCode(store.getStoreCode())
                        .storeName(store.getStoreName())
                        .storeType(store.getStoreType())
                        .city(store.getCity())
                        .state(store.getState())
                        .gstin(store.getGstin())
                        .build())
                .collect(Collectors.toList());
    }
}
