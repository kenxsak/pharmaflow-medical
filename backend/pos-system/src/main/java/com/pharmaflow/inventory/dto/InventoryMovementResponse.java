package com.pharmaflow.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovementResponse {

    private UUID movementId;
    private UUID storeId;
    private UUID batchId;
    private UUID medicineId;
    private String brandName;
    private String batchNumber;
    private String movementType;
    private String referenceType;
    private String referenceId;
    private String reasonCode;
    private String notes;
    private Integer quantityStripsDelta;
    private Integer quantityLooseDelta;
    private Integer quantityStripsAfter;
    private Integer quantityLooseAfter;
    private String inventoryStateAfter;
    private String actorName;
    private LocalDateTime createdAt;
}
