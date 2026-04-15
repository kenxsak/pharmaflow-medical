package com.pharmaflow.documents;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StoredDocumentRepository extends JpaRepository<StoredDocument, UUID> {
}
