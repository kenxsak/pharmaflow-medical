package com.pharmaflow.compliance;

import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.billing.Invoice;
import com.pharmaflow.medicine.Medicine;
import com.pharmaflow.store.Store;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScheduleHComplianceService {

    private final ScheduleDrugRegisterRepository scheduleDrugRegisterRepository;

    public boolean requiresComplianceRecord(String scheduleType) {
        return scheduleType != null &&
                ("H".equalsIgnoreCase(scheduleType)
                        || "H1".equalsIgnoreCase(scheduleType)
                        || "X".equalsIgnoreCase(scheduleType));
    }

    public ScheduleDrugRegister recordScheduleSale(
            Store store,
            Invoice invoice,
            Medicine medicine,
            String scheduleType,
            String patientName,
            Integer patientAge,
            String patientAddress,
            String doctorName,
            String doctorRegNo,
            BigDecimal qtySold,
            String batchNumber,
            PharmaUser pharmacist,
            String prescriptionUrl
    ) {
        if (patientName == null || patientName.isBlank()) {
            throw new IllegalArgumentException("Patient name is required for Schedule " + scheduleType + " drugs");
        }
        if (doctorName == null || doctorName.isBlank()) {
            throw new IllegalArgumentException("Doctor name is required for Schedule " + scheduleType + " drugs");
        }
        if (("H1".equalsIgnoreCase(scheduleType) || "X".equalsIgnoreCase(scheduleType))
                && (prescriptionUrl == null || prescriptionUrl.isBlank())) {
            throw new IllegalArgumentException("Prescription is mandatory for Schedule " + scheduleType + " drugs");
        }

        ScheduleDrugRegister entry = ScheduleDrugRegister.builder()
                .store(store)
                .invoice(invoice)
                .medicine(medicine)
                .scheduleType(scheduleType)
                .saleDate(LocalDateTime.now())
                .patientName(patientName)
                .patientAge(patientAge)
                .patientAddress(patientAddress)
                .doctorName(doctorName)
                .doctorRegNo(doctorRegNo)
                .quantitySold(qtySold)
                .batchNumber(batchNumber)
                .pharmacist(pharmacist)
                .prescriptionUrl(prescriptionUrl)
                .build();

        return scheduleDrugRegisterRepository.save(entry);
    }

    public List<ScheduleDrugRegister> getDrugInspectorReport(
            UUID storeId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String scheduleType
    ) {
        if (scheduleType == null || scheduleType.isBlank()) {
            return scheduleDrugRegisterRepository.findByStoreStoreIdAndSaleDateBetweenOrderBySaleDateDesc(
                    storeId,
                    fromDate,
                    toDate
            );
        }
        return scheduleDrugRegisterRepository.findByStoreStoreIdAndSaleDateBetweenAndScheduleTypeOrderBySaleDateDesc(
                storeId,
                fromDate,
                toDate,
                scheduleType
        );
    }

    public List<ScheduleDrugRegister> getNarcoticReport(UUID storeId, int month, int year) {
        LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime end = start.plusMonths(1);
        return scheduleDrugRegisterRepository.findNarcoticReport(storeId, start, end);
    }
}
