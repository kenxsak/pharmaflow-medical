package com.pharmaflow.procurement;

import com.pharmaflow.procurement.dto.PurchaseOrderSummaryResponse;
import com.pharmaflow.procurement.dto.SupplierCreateRequest;
import com.pharmaflow.procurement.dto.SupplierResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProcurementService {

    private final PharmaSupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @Transactional(readOnly = true)
    public List<SupplierResponse> listSuppliers() {
        return supplierRepository.findAllByIsActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toSupplierResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierCreateRequest request) {
        supplierRepository.findFirstByNameIgnoreCase(request.getName())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Supplier already exists with name " + request.getName());
                });

        Supplier supplier = supplierRepository.save(
                Supplier.builder()
                        .name(request.getName().trim())
                        .contact(trim(request.getContact()))
                        .phone(trim(request.getPhone()))
                        .email(trim(request.getEmail()))
                        .gstin(trim(request.getGstin()))
                        .drugLicense(trim(request.getDrugLicense()))
                        .address(trim(request.getAddress()))
                        .isActive(true)
                        .build()
        );
        return toSupplierResponse(supplier);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderSummaryResponse> listPurchaseOrders(java.util.UUID storeId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return purchaseOrderRepository.findByStoreStoreIdOrderByPoDateDesc(storeId, PageRequest.of(0, safeLimit))
                .stream()
                .map(order -> PurchaseOrderSummaryResponse.builder()
                        .purchaseOrderId(order.getPoId())
                        .poNumber(order.getPoNumber())
                        .poDate(order.getPoDate())
                        .invoiceNumber(order.getInvoiceNumber())
                        .supplierName(order.getSupplier() != null ? order.getSupplier().getName() : null)
                        .createdByName(order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null)
                        .status(order.getStatus())
                        .subtotal(order.getSubtotal())
                        .totalAmount(order.getTotalAmount())
                        .build())
                .collect(Collectors.toList());
    }

    private SupplierResponse toSupplierResponse(Supplier supplier) {
        return SupplierResponse.builder()
                .supplierId(supplier.getSupplierId())
                .name(supplier.getName())
                .contact(supplier.getContact())
                .phone(supplier.getPhone())
                .email(supplier.getEmail())
                .gstin(supplier.getGstin())
                .drugLicense(supplier.getDrugLicense())
                .address(supplier.getAddress())
                .build();
    }

    private String trim(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
