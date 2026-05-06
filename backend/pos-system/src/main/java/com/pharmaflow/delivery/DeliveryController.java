package com.pharmaflow.delivery;

import com.pharmaflow.delivery.dto.DeliveryDriverResponse;
import com.pharmaflow.delivery.dto.DeliveryLocationUpdateRequest;
import com.pharmaflow.delivery.dto.DeliveryOrderRequest;
import com.pharmaflow.delivery.dto.DeliveryOrderResponse;
import com.pharmaflow.delivery.dto.DeliveryStatusUpdateRequest;
import com.pharmaflow.delivery.dto.DeliverySummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/deliveries")
@Validated
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService deliveryService;

    @GetMapping
    public List<DeliveryOrderResponse> listDeliveries(
            @RequestHeader("X-Store-ID") UUID storeId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return deliveryService.listDeliveries(storeId, query, status, limit);
    }

    @GetMapping("/summary")
    public DeliverySummaryResponse getSummary(@RequestHeader("X-Store-ID") UUID storeId) {
        return deliveryService.getSummary(storeId);
    }

    @GetMapping("/drivers")
    public List<DeliveryDriverResponse> listDrivers(@RequestHeader("X-Store-ID") UUID storeId) {
        return deliveryService.listDrivers(storeId);
    }

    @PostMapping
    public DeliveryOrderResponse createDelivery(
            @RequestHeader("X-Store-ID") UUID storeId,
            @Valid @RequestBody DeliveryOrderRequest request
    ) {
        return deliveryService.createDelivery(storeId, request);
    }

    @PostMapping("/{deliveryId}/status")
    public DeliveryOrderResponse updateStatus(
            @PathVariable UUID deliveryId,
            @Valid @RequestBody DeliveryStatusUpdateRequest request
    ) {
        return deliveryService.updateStatus(deliveryId, request);
    }

    @PostMapping("/{deliveryId}/location")
    public DeliveryOrderResponse updateLocation(
            @PathVariable UUID deliveryId,
            @Valid @RequestBody DeliveryLocationUpdateRequest request
    ) {
        return deliveryService.updateLocation(deliveryId, request);
    }
}
