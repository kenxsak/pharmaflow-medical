package com.pharmaflow.procurement;

import com.pharmaflow.procurement.dto.PurchaseImportRequest;
import com.pharmaflow.procurement.dto.PurchaseImportResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CSVImportService {

    private final PurchaseImportService purchaseImportService;

    @Transactional
    public PurchaseImportResponse importPurchaseInvoice(UUID storeId, PurchaseImportRequest request) {
        return purchaseImportService.importPurchaseInvoice(storeId, request);
    }
}
