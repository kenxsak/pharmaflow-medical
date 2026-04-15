package com.pharmaflow.medicine;

import com.pharmaflow.medicine.dto.MedicineSearchResponse;
import com.pharmaflow.medicine.dto.SubstituteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    @GetMapping("/search")
    public List<MedicineSearchResponse> search(
            @RequestHeader(value = "X-Store-ID", required = false) String storeIdHeader,
            @RequestParam("q") String query
    ) {
        return medicineService.search(parseUuid(storeIdHeader), query);
    }

    @GetMapping("/barcode/{barcode}")
    public MedicineSearchResponse lookupByBarcode(
            @RequestHeader(value = "X-Store-ID", required = false) String storeIdHeader,
            @PathVariable String barcode
    ) {
        return medicineService.lookupByBarcode(parseUuid(storeIdHeader), barcode);
    }

    @GetMapping("/{medicineId}/substitutes")
    public List<SubstituteResponse> getSubstitutes(
            @RequestHeader(value = "X-Store-ID", required = false) String storeIdHeader,
            @PathVariable UUID medicineId
    ) {
        return medicineService.getSubstitutes(parseUuid(storeIdHeader), medicineId);
    }

    private UUID parseUuid(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return UUID.fromString(value);
    }
}
