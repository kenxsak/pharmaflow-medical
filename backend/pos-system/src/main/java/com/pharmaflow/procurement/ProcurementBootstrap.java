package com.pharmaflow.procurement;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProcurementBootstrap implements CommandLineRunner {

    private final PharmaSupplierRepository supplierRepository;

    @Override
    public void run(String... args) {
        if (supplierRepository.count() > 0) {
            return;
        }

        supplierRepository.save(
                Supplier.builder()
                        .name("Tamil Nadu Pharma Distributors")
                        .contact("Procurement Desk")
                        .phone("04400000000")
                        .gstin("33AADFT1234A1Z5")
                        .drugLicense("TN-SUP-001")
                        .address("Chennai, Tamil Nadu")
                        .isActive(true)
                        .build()
        );
    }
}
