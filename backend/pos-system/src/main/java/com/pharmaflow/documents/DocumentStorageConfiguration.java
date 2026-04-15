package com.pharmaflow.documents;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(DocumentStorageProperties.class)
public class DocumentStorageConfiguration {
}
