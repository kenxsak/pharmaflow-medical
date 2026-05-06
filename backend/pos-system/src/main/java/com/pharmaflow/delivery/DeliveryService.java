package com.pharmaflow.delivery;

import com.pharmaflow.auth.PharmaRoleName;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.auth.PharmaUserRepository;
import com.pharmaflow.billing.Invoice;
import com.pharmaflow.billing.InvoiceRepository;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.customer.Customer;
import com.pharmaflow.customer.CustomerRepository;
import com.pharmaflow.delivery.dto.DeliveryDriverResponse;
import com.pharmaflow.delivery.dto.DeliveryLocationUpdateRequest;
import com.pharmaflow.delivery.dto.DeliveryOrderRequest;
import com.pharmaflow.delivery.dto.DeliveryOrderResponse;
import com.pharmaflow.delivery.dto.DeliveryStatusUpdateRequest;
import com.pharmaflow.delivery.dto.DeliverySummaryResponse;
import com.pharmaflow.store.Store;
import com.pharmaflow.store.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private static final Set<String> VALID_STATUSES = Set.of(
            "PENDING",
            "ASSIGNED",
            "PICKED_UP",
            "OUT_FOR_DELIVERY",
            "DELIVERED",
            "CANCELLED"
    );

    private final DeliveryOrderRepository deliveryOrderRepository;
    private final StoreService storeService;
    private final InvoiceRepository invoiceRepository;
    private final CustomerRepository customerRepository;
    private final PharmaUserRepository pharmaUserRepository;

    @Transactional(readOnly = true)
    public List<DeliveryOrderResponse> listDeliveries(UUID storeId, String query, String status, int limit) {
        storeService.requireAccessibleStore(storeId);
        String normalizedStatus = normalizeOptionalStatus(status);
        int boundedLimit = Math.max(1, Math.min(limit, 100));

        return deliveryOrderRepository
                .searchByStoreId(storeId, normalizedStatus, trimToEmpty(query), PageRequest.of(0, boundedLimit))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DeliverySummaryResponse getSummary(UUID storeId) {
        storeService.requireAccessibleStore(storeId);
        return DeliverySummaryResponse.builder()
                .total(deliveryOrderRepository.countByStoreStoreId(storeId))
                .pending(deliveryOrderRepository.countByStoreStoreIdAndStatusIgnoreCase(storeId, "PENDING"))
                .assigned(deliveryOrderRepository.countByStoreStoreIdAndStatusIgnoreCase(storeId, "ASSIGNED")
                        + deliveryOrderRepository.countByStoreStoreIdAndStatusIgnoreCase(storeId, "PICKED_UP"))
                .outForDelivery(deliveryOrderRepository.countByStoreStoreIdAndStatusIgnoreCase(storeId, "OUT_FOR_DELIVERY"))
                .delivered(deliveryOrderRepository.countByStoreStoreIdAndStatusIgnoreCase(storeId, "DELIVERED"))
                .build();
    }

    @Transactional(readOnly = true)
    public List<DeliveryDriverResponse> listDrivers(UUID storeId) {
        storeService.requireAccessibleStore(storeId);
        return pharmaUserRepository
                .findActiveByStoreIdAndRole(storeId, PharmaRoleName.DELIVERY_BOY)
                .stream()
                .map(this::toDriverResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DeliveryOrderResponse createDelivery(UUID storeId, DeliveryOrderRequest request) {
        Store store = storeService.requireAccessibleStore(storeId);
        Invoice invoice = resolveInvoice(storeId, request.getInvoiceId());
        Customer customer = resolveCustomer(storeId, request.getCustomerId(), invoice);
        PharmaUser deliveryBoy = resolveDeliveryBoy(storeId, request.getDeliveryBoyId());
        BigDecimal amountToCollect = request.getAmountToCollect();
        if (amountToCollect == null && invoice != null) {
            amountToCollect = invoice.getAmountDue() != null && invoice.getAmountDue().compareTo(BigDecimal.ZERO) > 0
                    ? invoice.getAmountDue()
                    : invoice.getTotalAmount();
        }

        DeliveryOrder deliveryOrder = DeliveryOrder.builder()
                .store(store)
                .invoice(invoice)
                .customer(customer)
                .deliveryBoy(deliveryBoy)
                .deliveryAddress(request.getDeliveryAddress().trim())
                .deliveryPhone(firstNonBlank(request.getDeliveryPhone(), customer != null ? customer.getPhone() : null))
                .status(deliveryBoy != null ? "ASSIGNED" : "PENDING")
                .amountToCollect(amountToCollect == null ? BigDecimal.ZERO : amountToCollect)
                .amountCollected(BigDecimal.ZERO)
                .paymentMode(trimToNull(request.getPaymentMode()))
                .notes(trimToNull(request.getNotes()))
                .assignedAt(deliveryBoy != null ? LocalDateTime.now() : null)
                .build();

        return toResponse(deliveryOrderRepository.save(deliveryOrder));
    }

    @Transactional
    public DeliveryOrderResponse updateStatus(UUID deliveryId, DeliveryStatusUpdateRequest request) {
        DeliveryOrder deliveryOrder = requireAccessibleDelivery(deliveryId);
        String nextStatus = normalizeRequiredStatus(request.getStatus());
        PharmaUser deliveryBoy = resolveDeliveryBoy(
                deliveryOrder.getStore().getStoreId(),
                request.getDeliveryBoyId()
        );

        if (deliveryBoy != null) {
            deliveryOrder.setDeliveryBoy(deliveryBoy);
            if (deliveryOrder.getAssignedAt() == null) {
                deliveryOrder.setAssignedAt(LocalDateTime.now());
            }
        }

        applyStatusTimestamps(deliveryOrder, nextStatus);
        deliveryOrder.setStatus(nextStatus);

        if (request.getAmountCollected() != null) {
            deliveryOrder.setAmountCollected(request.getAmountCollected());
        } else if ("DELIVERED".equals(nextStatus) && deliveryOrder.getAmountCollected().compareTo(BigDecimal.ZERO) == 0) {
            deliveryOrder.setAmountCollected(deliveryOrder.getAmountToCollect());
        }
        if (request.getPaymentMode() != null) {
            deliveryOrder.setPaymentMode(trimToNull(request.getPaymentMode()));
        }
        if (request.getNotes() != null) {
            deliveryOrder.setNotes(trimToNull(request.getNotes()));
        }

        return toResponse(deliveryOrder);
    }

    @Transactional
    public DeliveryOrderResponse updateLocation(UUID deliveryId, DeliveryLocationUpdateRequest request) {
        DeliveryOrder deliveryOrder = requireAccessibleDelivery(deliveryId);
        validateCoordinate(request.getLatitude(), "Latitude", BigDecimal.valueOf(-90), BigDecimal.valueOf(90));
        validateCoordinate(request.getLongitude(), "Longitude", BigDecimal.valueOf(-180), BigDecimal.valueOf(180));

        deliveryOrder.setCurrentLatitude(request.getLatitude());
        deliveryOrder.setCurrentLongitude(request.getLongitude());
        deliveryOrder.setLastLocationAt(LocalDateTime.now());
        deliveryOrder.setLastLocationLabel(trimToNull(request.getLocationLabel()));

        return toResponse(deliveryOrder);
    }

    private DeliveryOrder requireAccessibleDelivery(UUID deliveryId) {
        DeliveryOrder deliveryOrder = deliveryOrderRepository.findByDeliveryId(deliveryId)
                .orElseThrow(() -> new BusinessRuleException("Delivery order not found"));
        storeService.requireAccessibleStore(deliveryOrder.getStore().getStoreId());
        return deliveryOrder;
    }

    private Invoice resolveInvoice(UUID storeId, UUID invoiceId) {
        if (invoiceId == null) {
            return null;
        }
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new BusinessRuleException("Invoice not found"));
        if (invoice.getStore() == null || !storeId.equals(invoice.getStore().getStoreId())) {
            throw new ForbiddenActionException("Invoice does not belong to the selected store");
        }
        return invoice;
    }

    private Customer resolveCustomer(UUID storeId, UUID customerId, Invoice invoice) {
        if (customerId == null) {
            return invoice != null ? invoice.getCustomer() : null;
        }
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new BusinessRuleException("Customer not found"));
        if (customer.getStore() == null || !storeId.equals(customer.getStore().getStoreId())) {
            throw new ForbiddenActionException("Customer does not belong to the selected store");
        }
        return customer;
    }

    private PharmaUser resolveDeliveryBoy(UUID storeId, UUID deliveryBoyId) {
        if (deliveryBoyId == null) {
            return null;
        }
        PharmaUser deliveryBoy = pharmaUserRepository.findById(deliveryBoyId)
                .orElseThrow(() -> new BusinessRuleException("Delivery person not found"));
        if (deliveryBoy.getStore() == null || !storeId.equals(deliveryBoy.getStore().getStoreId())) {
            throw new ForbiddenActionException("Delivery person must belong to the selected store");
        }
        if (!deliveryBoy.hasRole(PharmaRoleName.DELIVERY_BOY)) {
            throw new BusinessRuleException("Selected user is not a delivery person");
        }
        return deliveryBoy;
    }

    private void applyStatusTimestamps(DeliveryOrder deliveryOrder, String status) {
        LocalDateTime now = LocalDateTime.now();
        if ("ASSIGNED".equals(status) && deliveryOrder.getAssignedAt() == null) {
            deliveryOrder.setAssignedAt(now);
        }
        if ("PICKED_UP".equals(status) && deliveryOrder.getPickupAt() == null) {
            deliveryOrder.setPickupAt(now);
        }
        if ("OUT_FOR_DELIVERY".equals(status) && deliveryOrder.getOutForDeliveryAt() == null) {
            deliveryOrder.setOutForDeliveryAt(now);
        }
        if ("DELIVERED".equals(status) && deliveryOrder.getDeliveredAt() == null) {
            deliveryOrder.setDeliveredAt(now);
        }
        if ("CANCELLED".equals(status) && deliveryOrder.getCancelledAt() == null) {
            deliveryOrder.setCancelledAt(now);
        }
    }

    private String normalizeOptionalStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return "";
        }
        return normalizeRequiredStatus(status);
    }

    private String normalizeRequiredStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!VALID_STATUSES.contains(normalized)) {
            throw new BusinessRuleException("Unsupported delivery status");
        }
        return normalized;
    }

    private void validateCoordinate(BigDecimal value, String label, BigDecimal min, BigDecimal max) {
        if (value.compareTo(min) < 0 || value.compareTo(max) > 0) {
            throw new BusinessRuleException(label + " is outside the valid tracking range");
        }
    }

    private DeliveryOrderResponse toResponse(DeliveryOrder deliveryOrder) {
        Invoice invoice = deliveryOrder.getInvoice();
        Store store = deliveryOrder.getStore();
        Customer customer = deliveryOrder.getCustomer();
        PharmaUser deliveryBoy = deliveryOrder.getDeliveryBoy();

        return DeliveryOrderResponse.builder()
                .deliveryId(deliveryOrder.getDeliveryId())
                .invoiceId(invoice != null ? invoice.getInvoiceId() : null)
                .invoiceNo(invoice != null ? invoice.getInvoiceNo() : null)
                .storeId(store != null ? store.getStoreId() : null)
                .storeCode(store != null ? store.getStoreCode() : null)
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerName(customer != null ? customer.getName() : null)
                .deliveryBoyId(deliveryBoy != null ? deliveryBoy.getUserId() : null)
                .deliveryBoyName(deliveryBoy != null ? deliveryBoy.getFullName() : null)
                .deliveryBoyPhone(deliveryBoy != null ? deliveryBoy.getPhone() : null)
                .deliveryAddress(deliveryOrder.getDeliveryAddress())
                .deliveryPhone(deliveryOrder.getDeliveryPhone())
                .status(deliveryOrder.getStatus())
                .amountToCollect(deliveryOrder.getAmountToCollect())
                .amountCollected(deliveryOrder.getAmountCollected())
                .paymentMode(deliveryOrder.getPaymentMode())
                .notes(deliveryOrder.getNotes())
                .assignedAt(deliveryOrder.getAssignedAt())
                .pickupAt(deliveryOrder.getPickupAt())
                .outForDeliveryAt(deliveryOrder.getOutForDeliveryAt())
                .deliveredAt(deliveryOrder.getDeliveredAt())
                .cancelledAt(deliveryOrder.getCancelledAt())
                .currentLatitude(deliveryOrder.getCurrentLatitude())
                .currentLongitude(deliveryOrder.getCurrentLongitude())
                .lastLocationAt(deliveryOrder.getLastLocationAt())
                .lastLocationLabel(deliveryOrder.getLastLocationLabel())
                .createdAt(deliveryOrder.getCreatedAt())
                .build();
    }

    private DeliveryDriverResponse toDriverResponse(PharmaUser user) {
        return DeliveryDriverResponse.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .storeCode(user.getStore() != null ? user.getStore().getStoreCode() : null)
                .build();
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonBlank(String first, String second) {
        String normalizedFirst = trimToNull(first);
        return normalizedFirst != null ? normalizedFirst : trimToNull(second);
    }
}
