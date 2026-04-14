package com.pharmaflow.audit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private UUID logId;
    private LocalDateTime createdAt;
    private String action;
    private String entityType;
    private String entityId;
    private String userName;
    private String storeCode;
    private String oldValue;
    private String newValue;
}
