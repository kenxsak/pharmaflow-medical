package com.pharmaflow.auth;

import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@RequiredArgsConstructor
public class PharmaFlowBootstrap implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final StoreRepository storeRepository;
    private final PharmaUserRepository pharmaUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${pharmaflow.default-admin.username}")
    private String defaultUsername;

    @Value("${pharmaflow.default-admin.password}")
    private String defaultPassword;

    @Value("${pharmaflow.default-admin.full-name}")
    private String defaultFullName;

    @Value("${pharmaflow.default-admin.store-code}")
    private String defaultStoreCode;

    @Override
    public void run(String... args) {
        for (PharmaRoleName roleName : PharmaRoleName.values()) {
            RoleEntity role = roleRepository.findByRoleName(roleName).orElseGet(RoleEntity::new);
            role.setRoleName(roleName);
            role.setDescription(descriptionFor(roleName));
            role.setCanEditPrice(canEditPrice(roleName));
            role.setCanEditBills(canEditBills(roleName));
            role.setCanSellScheduleH(canSellScheduleH(roleName));
            role.setCanViewReports(canViewReports(roleName));
            role.setCanManageInventory(canManageInventory(roleName));
            roleRepository.save(role);
        }

        Store headOffice = storeRepository.findByStoreCode(defaultStoreCode)
                .orElseGet(() -> storeRepository.save(
                        Store.builder()
                                .storeCode(defaultStoreCode)
                                .storeName("PharmaFlow Head Office")
                                .storeType("HO")
                                .city("Chennai")
                                .state("Tamil Nadu")
                                .isActive(true)
                                .build()
                ));

        if (!pharmaUserRepository.existsByUsername(defaultUsername)) {
            RoleEntity superAdminRole = roleRepository.findByRoleName(PharmaRoleName.SUPER_ADMIN)
                    .orElseThrow();

                    pharmaUserRepository.save(
                            PharmaUser.builder()
                            .store(headOffice)
                            .username(defaultUsername)
                            .passwordHash(passwordEncoder.encode(defaultPassword))
                            .fullName(defaultFullName)
                            .email(defaultUsername)
                            .role(superAdminRole)
                            .isPlatformOwner(true)
                            .isActive(true)
                            .build()
            );
        }
    }

    private String descriptionFor(PharmaRoleName roleName) {
        switch (roleName) {
            case SUPER_ADMIN:
                return "Full access to all stores and head office";
            case STORE_MANAGER:
                return "Full access to the assigned store";
            case PHARMACIST:
                return "Can bill and handle Schedule H compliance";
            case SALES_ASSISTANT:
                return "Can create bills without price override";
            case WAREHOUSE_MGR:
                return "Can manage warehouse inventory and transfers";
            case DELIVERY_BOY:
                return "Home delivery application access only";
            default:
                return roleName.name();
        }
    }

    private boolean canEditPrice(PharmaRoleName roleName) {
        return roleName == PharmaRoleName.SUPER_ADMIN || roleName == PharmaRoleName.STORE_MANAGER;
    }

    private boolean canEditBills(PharmaRoleName roleName) {
        return roleName == PharmaRoleName.SUPER_ADMIN
                || roleName == PharmaRoleName.STORE_MANAGER
                || roleName == PharmaRoleName.PHARMACIST;
    }

    private boolean canSellScheduleH(PharmaRoleName roleName) {
        return roleName == PharmaRoleName.SUPER_ADMIN
                || roleName == PharmaRoleName.STORE_MANAGER
                || roleName == PharmaRoleName.PHARMACIST;
    }

    private boolean canViewReports(PharmaRoleName roleName) {
        return roleName != PharmaRoleName.DELIVERY_BOY && roleName != PharmaRoleName.SALES_ASSISTANT;
    }

    private boolean canManageInventory(PharmaRoleName roleName) {
        return roleName == PharmaRoleName.SUPER_ADMIN
                || roleName == PharmaRoleName.STORE_MANAGER
                || roleName == PharmaRoleName.WAREHOUSE_MGR
                || roleName == PharmaRoleName.PHARMACIST;
    }
}
