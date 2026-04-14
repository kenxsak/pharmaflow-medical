package com.pharmaflow.compliance;

import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.billing.Invoice;
import com.pharmaflow.billing.dto.BillingItemRequest;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.medicine.MedicineRepository;
import com.pharmaflow.store.Store;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ComplianceService {

    private final ScheduleHComplianceService scheduleHComplianceService;
    private final MedicineRepository medicineRepository;

    public boolean requiresComplianceRecord(String scheduleType) {
        return scheduleHComplianceService.requiresComplianceRecord(scheduleType);
    }

    public void validatePrescriptionRequirement(List<BillingItemRequest> items, String prescriptionUrl) {
        if (items == null || items.isEmpty()) {
            return;
        }
        boolean requiresStrictPrescription = items.stream()
                .map(item -> medicineRepository.findById(item.getMedicineId())
                        .orElseThrow(() -> new BusinessRuleException("Medicine not found for compliance validation")))
                .anyMatch(medicine -> "H1".equalsIgnoreCase(medicine.getScheduleType())
                        || "X".equalsIgnoreCase(medicine.getScheduleType()));

        if (requiresStrictPrescription && (prescriptionUrl == null || prescriptionUrl.isBlank())) {
            throw new BusinessRuleException("Prescription is mandatory for Schedule H1/X medicines");
        }
    }

    public void validateScheduleDetails(String scheduleType, String patientName, String doctorName, String prescriptionUrl) {
        if (!requiresComplianceRecord(scheduleType)) {
            return;
        }
        if (patientName == null || patientName.isBlank()) {
            throw new BusinessRuleException("Patient name is required for Schedule " + scheduleType + " medicines");
        }
        if (doctorName == null || doctorName.isBlank()) {
            throw new BusinessRuleException("Doctor name is required for Schedule " + scheduleType + " medicines");
        }
        if (("H1".equalsIgnoreCase(scheduleType) || "X".equalsIgnoreCase(scheduleType))
                && (prescriptionUrl == null || prescriptionUrl.isBlank())) {
            throw new BusinessRuleException("Prescription is mandatory for Schedule " + scheduleType + " medicines");
        }
    }

    public ScheduleDrugRegister recordScheduleSale(
            Store store,
            Invoice invoice,
            Medicine medicine,
            String patientName,
            Integer patientAge,
            String patientAddress,
            String doctorName,
            String doctorRegNo,
            BigDecimal quantitySold,
            String batchNumber,
            PharmaUser pharmacist,
            String prescriptionUrl
    ) {
        validateScheduleDetails(medicine.getScheduleType(), patientName, doctorName, prescriptionUrl);
        return scheduleHComplianceService.recordScheduleSale(
                store,
                invoice,
                medicine,
                medicine.getScheduleType(),
                patientName,
                patientAge,
                patientAddress,
                doctorName,
                doctorRegNo,
                quantitySold,
                batchNumber,
                pharmacist,
                prescriptionUrl
        );
    }

    public List<ScheduleDrugRegister> getDrugInspectorReport(
            UUID storeId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String scheduleType
    ) {
        return scheduleHComplianceService.getDrugInspectorReport(storeId, fromDate, toDate, scheduleType);
    }

    public List<ScheduleDrugRegister> getNarcoticReport(UUID storeId, int month, int year) {
        return scheduleHComplianceService.getNarcoticReport(storeId, month, year);
    }
}
