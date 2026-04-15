package com.pharmaflow.documents.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class UploadedDocumentResponse {

    private UUID documentId;
    private String documentUrl;
    private String originalFileName;
    private String contentType;
    private Long sizeBytes;
    private String storageProvider;
}
