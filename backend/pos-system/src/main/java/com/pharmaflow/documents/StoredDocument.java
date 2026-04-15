package com.pharmaflow.documents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stored_documents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoredDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "document_id")
    private UUID documentId;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "store_id")
    private UUID storeId;

    @Column(name = "document_type", length = 50, nullable = false)
    private String documentType;

    @Column(name = "original_file_name", length = 255, nullable = false)
    private String originalFileName;

    @Column(name = "content_type", length = 120, nullable = false)
    private String contentType;

    @Column(name = "storage_provider", length = 20, nullable = false)
    private String storageProvider;

    @Column(name = "storage_key", length = 500, nullable = false, unique = true)
    private String storageKey;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    @Column(name = "checksum_sha256", length = 64, nullable = false)
    private String checksumSha256;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
