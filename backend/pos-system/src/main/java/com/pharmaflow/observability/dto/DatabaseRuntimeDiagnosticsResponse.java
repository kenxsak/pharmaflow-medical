package com.pharmaflow.observability.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatabaseRuntimeDiagnosticsResponse {

    private OffsetDateTime capturedAt;
    private String status;
    private boolean dbReachable;
    private Long dbPingMs;
    private String poolName;
    private String applicationName;
    private int activeConnections;
    private int idleConnections;
    private int pendingConnections;
    private int maxConnections;
    private int minConnections;
    private Double utilizationPercent;
    private Double acquireMeanMs;
    private Double usageMeanMs;
    private Long timeoutCount;
    private String errorSummary;
    private List<String> advisory;
}
