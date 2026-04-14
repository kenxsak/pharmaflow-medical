package com.pharmaflow.customer;

import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.customer.dto.CustomerLookupResponse;
import com.pharmaflow.customer.dto.PatientHistoryResponse;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreRepository;
import com.pharmaflow.tenant.TenantRequestContext;
import com.pharmaflow.tenant.TenantRequestContextHolder;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final LoyaltyTransactionRepository loyaltyTransactionRepository;
    private final PatientPrescriptionRepository patientPrescriptionRepository;

    public CustomerLookupResponse lookupByPhone(String phone) {
        Customer customer = customerRepository.findByPhoneAndIsActiveTrue(phone)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found for phone " + phone));
        ensureCustomerInTenantScope(customer);
        return toLookupResponse(customer);
    }

    public List<CustomerLookupResponse> searchCustomers(UUID storeId, String query, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return customerRepository.searchByStoreId(storeId, query, PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toLookupResponse)
                .collect(Collectors.toList());
    }

    public Customer getCustomerOrThrow(UUID customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        ensureCustomerInTenantScope(customer);
        return customer;
    }

    public CustomerLookupResponse getCustomer(UUID customerId) {
        return toLookupResponse(getCustomerOrThrow(customerId));
    }

    @Transactional
    public CustomerLookupResponse createCustomer(UUID storeId, Customer customerDraft) {
        if (customerDraft.getName() == null || customerDraft.getName().isBlank()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found"));
        customerDraft.setStore(store);
        applyEditableFields(customerDraft);
        customerDraft.setIsActive(true);
        if (customerDraft.getIsBlocked() == null) {
            customerDraft.setIsBlocked(false);
        }
        Customer saved = customerRepository.save(customerDraft);
        return toLookupResponse(saved);
    }

    @Transactional
    public CustomerLookupResponse updateCustomer(UUID customerId, Customer customerDraft) {
        Customer customer = getCustomerOrThrow(customerId);
        customer.setName(customerDraft.getName());
        customer.setPhone(customerDraft.getPhone());
        customer.setEmail(customerDraft.getEmail());
        customer.setAddress(customerDraft.getAddress());
        customer.setDoctorName(customerDraft.getDoctorName());
        customer.setCreditLimit(customerDraft.getCreditLimit());
        if (customerDraft.getIsBlocked() != null) {
            customer.setIsBlocked(customerDraft.getIsBlocked());
        }
        applyEditableFields(customer);
        Customer saved = customerRepository.save(customer);
        return toLookupResponse(saved);
    }

    @Transactional
    public void validateCreditLimit(UUID customerId, BigDecimal requestedAmount) {
        Customer customer = getCustomerOrThrow(customerId);
        if (Boolean.TRUE.equals(customer.getIsBlocked())) {
            throw new IllegalArgumentException("Customer is blocked for credit sales");
        }
        BigDecimal availableCredit = safe(customer.getCreditLimit()).subtract(safe(customer.getCurrentBalance()));
        if (availableCredit.compareTo(requestedAmount == null ? BigDecimal.ZERO : requestedAmount) < 0) {
            throw new IllegalArgumentException("Customer credit limit exceeded");
        }
    }

    @Transactional
    public CustomerLookupResponse addLoyaltyPoints(UUID customerId, int points, UUID invoiceId, String description) {
        Customer customer = getCustomerOrThrow(customerId);
        int updatedPoints = safe(customer.getLoyaltyPoints()) + Math.max(points, 0);
        customer.setLoyaltyPoints(updatedPoints);
        customerRepository.save(customer);

        loyaltyTransactionRepository.save(
                LoyaltyTransaction.builder()
                        .customer(customer)
                        .store(customer.getStore())
                        .invoiceId(invoiceId)
                        .pointsEarned(Math.max(points, 0))
                        .pointsRedeemed(0)
                        .balanceAfter(updatedPoints)
                        .description(description == null || description.isBlank() ? "Loyalty points added" : description)
                        .build()
        );

        return toLookupResponse(customer);
    }

    public List<PatientHistoryResponse> getPatientHistory(UUID customerId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Customer customer = getCustomerOrThrow(customerId);
        return patientPrescriptionRepository.findByCustomerCustomerIdOrderByCreatedAtDesc(customerId, PageRequest.of(0, safeLimit))
                .getContent()
                .stream()
                .map(history -> PatientHistoryResponse.builder()
                        .historyId(history.getHistoryId())
                        .customerId(customer.getCustomerId())
                        .medicineId(history.getMedicine() != null ? history.getMedicine().getMedicineId() : null)
                        .medicineName(history.getMedicine() != null ? history.getMedicine().getBrandName() : null)
                        .invoiceId(history.getInvoiceId())
                        .doctorName(history.getDoctorName())
                        .doctorRegNo(history.getDoctorRegNo())
                        .prescriptionUrl(history.getPrescriptionUrl())
                        .quantity(history.getQuantity())
                        .notes(history.getNotes())
                        .createdAt(history.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private void ensureCustomerInTenantScope(Customer customer) {
        TenantRequestContext context = TenantRequestContextHolder.get();
        if (context == null || context.getTenant() == null) {
            return;
        }
        if (customer.getStore() == null || customer.getStore().getTenant() == null
                || !context.getTenant().getTenantId().equals(customer.getStore().getTenant().getTenantId())) {
            throw new ForbiddenActionException("Customer does not belong to the active tenant");
        }
    }

    private CustomerLookupResponse toLookupResponse(Customer customer) {
        BigDecimal creditLimit = safe(customer.getCreditLimit());
        BigDecimal currentBalance = safe(customer.getCurrentBalance());
        return CustomerLookupResponse.builder()
                .customerId(customer.getCustomerId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .address(customer.getAddress())
                .doctorName(customer.getDoctorName())
                .creditLimit(creditLimit)
                .currentBalance(currentBalance)
                .availableCredit(creditLimit.subtract(currentBalance))
                .loyaltyPoints(customer.getLoyaltyPoints())
                .blocked(customer.getIsBlocked())
                .build();
    }

    private void applyEditableFields(Customer customer) {
        if (customer.getName() == null || customer.getName().isBlank()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        customer.setName(customer.getName().trim());
        customer.setPhone(normalize(customer.getPhone()));
        customer.setEmail(normalize(customer.getEmail()));
        customer.setAddress(normalize(customer.getAddress()));
        customer.setDoctorName(normalize(customer.getDoctorName()));
        customer.setCreditLimit(safe(customer.getCreditLimit()));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Integer safe(Integer value) {
        return value == null ? 0 : value;
    }
}
