package com.pharmaflow.audit;

import com.pharmaflow.audit.dto.AuditLogResponse;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.store.Store;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(Store store, PharmaUser user, String action, String entityType, String entityId, String oldValue, String newValue) {
        auditLogRepository.save(
                AuditLog.builder()
                        .store(store)
                        .user(user)
                        .action(action)
                        .entityType(entityType)
                        .entityId(entityId)
                        .oldValue(oldValue)
                        .newValue(newValue)
                        .build()
        );
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogs(UUID storeId, String entityType, String query, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return auditLogRepository.searchLogs(storeId, entityType, query, PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getEntityLogs(UUID storeId, String entityType, String entityId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return auditLogRepository.findByStoreStoreIdAndEntityTypeIgnoreCaseAndEntityIdOrderByCreatedAtDesc(
                        storeId,
                        entityType,
                        entityId,
                        PageRequest.of(0, safeLimit)
                )
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getUserActivity(UUID storeId, UUID userId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 200));
        return auditLogRepository.findByStoreStoreIdAndUserUserIdOrderByCreatedAtDesc(
                        storeId,
                        userId,
                        PageRequest.of(0, safeLimit)
                )
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .logId(log.getLogId())
                .createdAt(log.getCreatedAt())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .userName(log.getUser() != null ? log.getUser().getFullName() : null)
                .storeCode(log.getStore() != null ? log.getStore().getStoreCode() : null)
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .build();
    }
}
