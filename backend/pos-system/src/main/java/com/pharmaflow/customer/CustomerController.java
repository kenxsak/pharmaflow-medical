package com.pharmaflow.customer;

import com.pharmaflow.customer.dto.CustomerCreateRequest;
import com.pharmaflow.customer.dto.CustomerLookupResponse;
import com.pharmaflow.customer.dto.PatientHistoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/lookup")
    public CustomerLookupResponse lookupByPhone(@RequestParam String phone) {
        return customerService.lookupByPhone(phone);
    }

    @GetMapping("/search")
    public List<CustomerLookupResponse> searchCustomers(
            @RequestParam UUID storeId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return customerService.searchCustomers(storeId, query, limit);
    }

    @GetMapping("/{customerId}/history")
    public List<PatientHistoryResponse> getPatientHistory(
            @PathVariable UUID customerId,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return customerService.getPatientHistory(customerId, limit);
    }

    @PostMapping
    public CustomerLookupResponse createCustomer(
            @RequestParam UUID storeId,
            @Valid @RequestBody CustomerCreateRequest request
    ) {
        Customer customer = Customer.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .doctorName(request.getDoctorName())
                .creditLimit(request.getCreditLimit())
                .build();
        return customerService.createCustomer(storeId, customer);
    }

    @GetMapping("/{customerId}/validate-credit")
    public Map<String, Object> validateCredit(
            @PathVariable UUID customerId,
            @RequestParam BigDecimal amount
    ) {
        customerService.validateCreditLimit(customerId, amount);
        return Map.of("valid", true, "customerId", customerId, "amount", amount);
    }

    @PostMapping("/{customerId}/loyalty")
    public CustomerLookupResponse addLoyaltyPoints(
            @PathVariable UUID customerId,
            @RequestParam int points,
            @RequestParam(required = false) UUID invoiceId,
            @RequestParam(required = false) String description
    ) {
        return customerService.addLoyaltyPoints(customerId, points, invoiceId, description);
    }
}
