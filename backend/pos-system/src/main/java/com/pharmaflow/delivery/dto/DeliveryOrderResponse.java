package com.pharmaflow.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryOrderResponse {

    private UUID deliveryId;
    private UUID invoiceId;
    private String invoiceNo;
    private UUID storeId;
    private String storeCode;
    private UUID customerId;
    private String customerName;
    private UUID deliveryBoyId;
    private String deliveryBoyName;
    private String deliveryBoyPhone;
    private String deliveryAddress;
    private String deliveryPhone;
    private String status;
    private BigDecimal amountToCollect;
    private BigDecimal amountCollected;
    private String paymentMode;
    private String notes;
    private LocalDateTime assignedAt;
    private LocalDateTime pickupAt;
    private LocalDateTime outForDeliveryAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime cancelledAt;
    private BigDecimal currentLatitude;
    private BigDecimal currentLongitude;
    private LocalDateTime lastLocationAt;
    private String lastLocationLabel;
    private LocalDateTime createdAt;
}
