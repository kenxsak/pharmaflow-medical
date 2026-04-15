package com.pharmaflow.compliance;

import com.pharmaflow.compliance.dto.ScheduleRegisterResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/compliance")
@RequiredArgsConstructor
public class ComplianceController {

    private final ScheduleHComplianceService scheduleHComplianceService;

    @GetMapping("/schedule-register")
    public List<ScheduleRegisterResponse> getScheduleRegister(
            @RequestParam UUID storeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String schedule
    ) {
        return scheduleHComplianceService.getDrugInspectorReport(storeId, from, to, schedule)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/drug-inspector-report")
    public List<ScheduleRegisterResponse> getDrugInspectorReport(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year,
            @RequestParam(required = false) String schedule
    ) {
        YearMonth yearMonth = YearMonth.of(year, month);
        return scheduleHComplianceService.getDrugInspectorReport(
                storeId,
                yearMonth.atDay(1).atStartOfDay(),
                yearMonth.plusMonths(1).atDay(1).atStartOfDay(),
                schedule
        ).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/narcotic-report")
    public List<ScheduleRegisterResponse> getNarcoticReport(
            @RequestParam UUID storeId,
            @RequestParam int month,
            @RequestParam int year
    ) {
        return scheduleHComplianceService.getNarcoticReport(storeId, month, year)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/prescription-archive")
    public List<ScheduleRegisterResponse> searchPrescriptionArchive(
            @RequestParam UUID storeId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String schedule,
            @RequestParam(defaultValue = "50") int limit
    ) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return scheduleHComplianceService.searchArchive(storeId, schedule, query, safeLimit)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private ScheduleRegisterResponse toResponse(ScheduleDrugRegister entry) {
        return ScheduleRegisterResponse.builder()
                .registerId(entry.getRegisterId())
                .invoiceId(entry.getInvoice() != null ? entry.getInvoice().getInvoiceId() : null)
                .medicineId(entry.getMedicine() != null ? entry.getMedicine().getMedicineId() : null)
                .medicineName(entry.getMedicine() != null ? entry.getMedicine().getBrandName() : null)
                .scheduleType(entry.getScheduleType())
                .saleDate(entry.getSaleDate())
                .patientName(entry.getPatientName())
                .patientAge(entry.getPatientAge())
                .patientAddress(entry.getPatientAddress())
                .doctorName(entry.getDoctorName())
                .doctorRegNo(entry.getDoctorRegNo())
                .quantitySold(entry.getQuantitySold())
                .batchNumber(entry.getBatchNumber())
                .pharmacistId(entry.getPharmacist() != null ? entry.getPharmacist().getUserId() : null)
                .pharmacistName(entry.getPharmacist() != null ? entry.getPharmacist().getFullName() : null)
                .prescriptionUrl(entry.getPrescriptionUrl())
                .remarks(entry.getRemarks())
                .build();
    }
}
