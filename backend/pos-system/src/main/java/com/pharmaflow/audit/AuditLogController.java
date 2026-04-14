package com.pharmaflow.audit;

import com.pharmaflow.audit.dto.AuditLogResponse;
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
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping("/logs")
    public List<AuditLogResponse> getLogs(
            @RequestHeader("X-Store-ID") UUID storeId,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "100") int limit
    ) {
        return auditLogService.getLogs(storeId, entityType, query, limit);
    }

    @GetMapping("/entity")
    public List<AuditLogResponse> getEntityLogs(
            @RequestHeader("X-Store-ID") UUID storeId,
            @RequestParam String entityType,
            @RequestParam String entityId,
            @RequestParam(defaultValue = "100") int limit
    ) {
        return auditLogService.getEntityLogs(storeId, entityType, entityId, limit);
    }

    @GetMapping("/user/{userId}")
    public List<AuditLogResponse> getUserActivity(
            @RequestHeader("X-Store-ID") UUID storeId,
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "100") int limit
    ) {
        return auditLogService.getUserActivity(storeId, userId, limit);
    }
}
