package com.pharmaflow.inventory;

import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.inventory.dto.InventoryAdjustmentRequest;
import com.pharmaflow.inventory.dto.InventoryBatchStateRequest;
import com.pharmaflow.inventory.dto.InventoryMovementResponse;
import com.pharmaflow.medicine.Medicine;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryMovementService {

    private final InventoryBatchRepository inventoryBatchRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final CurrentPharmaUserService currentPharmaUserService;

    @Transactional(readOnly = true)
    public List<InventoryMovementResponse> listMovements(UUID storeId, UUID batchId, UUID medicineId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return inventoryMovementRepository.searchByStore(storeId, batchId, medicineId, PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public InventoryMovement applyPackLooseDelta(UUID batchId,
                                                 int stripDelta,
                                                 int looseDelta,
                                                 String movementType,
                                                 String reasonCode,
                                                 String referenceType,
                                                 String referenceId,
                                                 String notes,
                                                 PharmaUser actor) {
        InventoryBatch batch = inventoryBatchRepository.findByIdForUpdate(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found"));
        validateMovementAllowed(batch, movementType);

        int packSize = safePackSize(batch.getMedicine());
        int currentLooseUnits = toLooseUnits(safe(batch.getQuantityStrips()), safe(batch.getQuantityLoose()), batch.getMedicine());
        int deltaLooseUnits = (stripDelta * packSize) + looseDelta;
        int updatedLooseUnits = currentLooseUnits + deltaLooseUnits;

        if (updatedLooseUnits < 0) {
            throw new BusinessRuleException("Stock movement would result in negative quantity for batch " + batch.getBatchNumber());
        }

        applyLooseUnits(batch, updatedLooseUnits);
        normalizeBatchState(batch, movementType, updatedLooseUnits);
        inventoryBatchRepository.save(batch);

        InventoryMovement movement = inventoryMovementRepository.save(
                InventoryMovement.builder()
                        .store(batch.getStore())
                        .batch(batch)
                        .medicine(batch.getMedicine())
                        .actor(actor)
                        .movementType(normalizeText(movementType))
                        .referenceType(normalizeText(referenceType))
                        .referenceId(referenceId)
                        .reasonCode(normalizeText(reasonCode))
                        .notes(trim(notes))
                        .quantityStripsDelta(stripDelta)
                        .quantityLooseDelta(looseDelta)
                        .quantityStripsAfter(safe(batch.getQuantityStrips()))
                        .quantityLooseAfter(safe(batch.getQuantityLoose()))
                        .inventoryStateAfter(batch.getInventoryState())
                        .build()
        );

        return movement;
    }

    @Transactional
    public InventoryMovement applyQuantity(UUID batchId,
                                           BigDecimal quantity,
                                           String unitType,
                                           String movementType,
                                           String reasonCode,
                                           String referenceType,
                                           String referenceId,
                                           String notes,
                                           PharmaUser actor) {
        int normalizedQuantity = toRequestedUnits(quantity);
        if (isPackUnitType(unitType)) {
            return applyPackLooseDelta(
                    batchId,
                    normalizedQuantity,
                    0,
                    movementType,
                    reasonCode,
                    referenceType,
                    referenceId,
                    notes,
                    actor
            );
        }
        return applyPackLooseDelta(
                batchId,
                0,
                normalizedQuantity,
                movementType,
                reasonCode,
                referenceType,
                referenceId,
                notes,
                actor
        );
    }

    @Transactional
    public InventoryMovementResponse adjustStock(InventoryAdjustmentRequest request) {
        PharmaUser actor = currentPharmaUserService.requireCurrentUser();
        String normalizedType = normalizeText(request.getAdjustmentType());
        int multiplier;
        String movementType;

        switch (normalizedType) {
            case "ADD":
                multiplier = 1;
                movementType = "ADJUST_ADD";
                break;
            case "REMOVE":
                multiplier = -1;
                movementType = "ADJUST_REMOVE";
                break;
            case "DUMP":
                multiplier = -1;
                movementType = "DUMP";
                break;
            default:
                throw new BusinessRuleException("Unsupported adjustment type " + request.getAdjustmentType());
        }

        InventoryMovement movement = applyQuantity(
                request.getBatchId(),
                request.getQuantity().multiply(BigDecimal.valueOf(multiplier)),
                request.getUnitType(),
                movementType,
                request.getReasonCode(),
                "MANUAL_ADJUSTMENT",
                request.getBatchId().toString(),
                request.getNotes(),
                actor
        );
        return toResponse(movement);
    }

    @Transactional
    public InventoryMovementResponse quarantineBatch(UUID batchId, InventoryBatchStateRequest request) {
        return toResponse(changeBatchState(
                batchId,
                "QUARANTINED",
                "QUARANTINE",
                request.getReasonCode(),
                "BATCH_STATE",
                batchId.toString(),
                request.getNotes(),
                currentPharmaUserService.requireCurrentUser()
        ));
    }

    @Transactional
    public InventoryMovementResponse releaseBatch(UUID batchId, InventoryBatchStateRequest request) {
        InventoryBatch batch = inventoryBatchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found"));
        if (batch.getExpiryDate() == null || !batch.getExpiryDate().isAfter(LocalDate.now())) {
            throw new BusinessRuleException("Expired batches cannot be released back to sellable stock");
        }
        if (safe(batch.getQuantityStrips()) <= 0 && safe(batch.getQuantityLoose()) <= 0) {
            throw new BusinessRuleException("Empty batches cannot be released back to sellable stock");
        }
        return toResponse(changeBatchState(
                batchId,
                "SELLABLE",
                "RELEASE",
                request.getReasonCode(),
                "BATCH_STATE",
                batchId.toString(),
                request.getNotes(),
                currentPharmaUserService.requireCurrentUser()
        ));
    }

    @Transactional
    public InventoryMovement changeBatchState(UUID batchId,
                                              String newState,
                                              String movementType,
                                              String reasonCode,
                                              String referenceType,
                                              String referenceId,
                                              String notes,
                                              PharmaUser actor) {
        InventoryBatch batch = inventoryBatchRepository.findByIdForUpdate(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory batch not found"));
        String normalizedState = normalizeText(newState);
        if (!List.of("SELLABLE", "QUARANTINED", "DUMPED").contains(normalizedState)) {
            throw new BusinessRuleException("Unsupported batch state " + newState);
        }
        if ("SELLABLE".equals(normalizedState)
                && (batch.getExpiryDate() == null || !batch.getExpiryDate().isAfter(LocalDate.now()))) {
            throw new BusinessRuleException("Expired batches cannot be marked sellable");
        }

        batch.setInventoryState(normalizedState);
        if ("DUMPED".equals(normalizedState)) {
            batch.setIsActive(false);
        } else if (safe(batch.getQuantityStrips()) > 0 || safe(batch.getQuantityLoose()) > 0) {
            batch.setIsActive(true);
        }
        inventoryBatchRepository.save(batch);

        return inventoryMovementRepository.save(
                InventoryMovement.builder()
                        .store(batch.getStore())
                        .batch(batch)
                        .medicine(batch.getMedicine())
                        .actor(actor)
                        .movementType(normalizeText(movementType))
                        .referenceType(normalizeText(referenceType))
                        .referenceId(referenceId)
                        .reasonCode(normalizeText(reasonCode))
                        .notes(trim(notes))
                        .quantityStripsDelta(0)
                        .quantityLooseDelta(0)
                        .quantityStripsAfter(safe(batch.getQuantityStrips()))
                        .quantityLooseAfter(safe(batch.getQuantityLoose()))
                        .inventoryStateAfter(batch.getInventoryState())
                        .build()
        );
    }

    private void validateMovementAllowed(InventoryBatch batch, String movementType) {
        String normalizedType = normalizeText(movementType);
        String inventoryState = normalizeText(batch.getInventoryState());
        LocalDate today = LocalDate.now();

        if (List.of("SALE", "TRANSFER_OUT", "VENDOR_RETURN", "ADJUST_REMOVE").contains(normalizedType)) {
            if (!"SELLABLE".equals(inventoryState)) {
                throw new BusinessRuleException("Only sellable stock can be used for " + normalizedType.toLowerCase(Locale.ROOT));
            }
            if (batch.getExpiryDate() == null || !batch.getExpiryDate().isAfter(today)) {
                throw new BusinessRuleException("Expired stock cannot be used for " + normalizedType.toLowerCase(Locale.ROOT));
            }
        }

        if ("DUMP".equals(normalizedType) && "DUMPED".equals(inventoryState)) {
            throw new BusinessRuleException("Dumped stock cannot be dumped again");
        }
    }

    private void normalizeBatchState(InventoryBatch batch, String movementType, int totalLooseUnits) {
        String currentState = normalizeText(batch.getInventoryState());
        LocalDate today = LocalDate.now();

        if (totalLooseUnits <= 0) {
            batch.setIsActive(false);
            if ("DUMP".equals(normalizeText(movementType))) {
                batch.setInventoryState("DUMPED");
            } else if (currentState.isBlank()) {
                batch.setInventoryState("SELLABLE");
            }
            return;
        }

        batch.setIsActive(true);
        if (batch.getExpiryDate() == null || !batch.getExpiryDate().isAfter(today)) {
            if ("SELLABLE".equals(currentState) || currentState.isBlank()) {
                batch.setInventoryState("QUARANTINED");
            }
            return;
        }

        if (currentState.isBlank()) {
            batch.setInventoryState("SELLABLE");
        }
    }

    private void applyLooseUnits(InventoryBatch batch, int totalLooseUnits) {
        int packSize = safePackSize(batch.getMedicine());
        batch.setQuantityStrips(totalLooseUnits / packSize);
        batch.setQuantityLoose(totalLooseUnits % packSize);
    }

    private int toLooseUnits(Integer strips, Integer loose, Medicine medicine) {
        return safe(strips) * safePackSize(medicine) + safe(loose);
    }

    private int toRequestedUnits(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessRuleException("Quantity must be non-zero");
        }
        return quantity.setScale(0, RoundingMode.HALF_UP).intValueExact();
    }

    private boolean isPackUnitType(String unitType) {
        return "PACK".equalsIgnoreCase(unitType) || "STRIP".equalsIgnoreCase(unitType);
    }

    private int safePackSize(Medicine medicine) {
        return medicine == null || medicine.getPackSize() == null || medicine.getPackSize() <= 0
                ? 1
                : medicine.getPackSize();
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String trim(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public InventoryMovementResponse toResponse(InventoryMovement movement) {
        return InventoryMovementResponse.builder()
                .movementId(movement.getMovementId())
                .storeId(movement.getStore() != null ? movement.getStore().getStoreId() : null)
                .batchId(movement.getBatch() != null ? movement.getBatch().getBatchId() : null)
                .medicineId(movement.getMedicine() != null ? movement.getMedicine().getMedicineId() : null)
                .brandName(movement.getMedicine() != null ? movement.getMedicine().getBrandName() : null)
                .batchNumber(movement.getBatch() != null ? movement.getBatch().getBatchNumber() : null)
                .movementType(movement.getMovementType())
                .referenceType(movement.getReferenceType())
                .referenceId(movement.getReferenceId())
                .reasonCode(movement.getReasonCode())
                .notes(movement.getNotes())
                .quantityStripsDelta(movement.getQuantityStripsDelta())
                .quantityLooseDelta(movement.getQuantityLooseDelta())
                .quantityStripsAfter(movement.getQuantityStripsAfter())
                .quantityLooseAfter(movement.getQuantityLooseAfter())
                .inventoryStateAfter(movement.getInventoryStateAfter())
                .actorName(movement.getActor() != null ? movement.getActor().getFullName() : null)
                .createdAt(movement.getCreatedAt())
                .build();
    }
}
