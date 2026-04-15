CREATE TABLE IF NOT EXISTS stored_documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(tenant_id),
    store_id UUID REFERENCES stores(store_id),
    document_type VARCHAR(50) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    storage_provider VARCHAR(20) NOT NULL,
    storage_key VARCHAR(500) NOT NULL UNIQUE,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    checksum_sha256 VARCHAR(64) NOT NULL,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stored_documents_tenant_created
    ON stored_documents(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stored_documents_store_created
    ON stored_documents(store_id, created_at DESC);
