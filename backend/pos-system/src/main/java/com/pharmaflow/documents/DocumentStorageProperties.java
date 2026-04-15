package com.pharmaflow.documents;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Getter
@Setter
@ConfigurationProperties(prefix = "pharmaflow.storage")
public class DocumentStorageProperties {

    private String provider = "auto";
    private String localRoot = "./data/documents";
    private long maxFileSizeBytes = 10 * 1024 * 1024;
    private List<String> allowedContentTypes = new ArrayList<>(
            List.of("application/pdf", "image/jpeg", "image/png", "image/webp")
    );

    public String normalizedProvider() {
        return provider == null ? "auto" : provider.trim().toLowerCase(Locale.ROOT);
    }
}
