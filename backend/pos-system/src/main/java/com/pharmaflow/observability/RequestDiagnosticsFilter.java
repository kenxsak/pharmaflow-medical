package com.pharmaflow.observability;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestDiagnosticsFilter extends OncePerRequestFilter {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String MDC_REQUEST_ID = "requestId";

    private final long slowRequestThresholdMs;

    public RequestDiagnosticsFilter(
            @Value("${pharmaflow.observability.slow-request-threshold-ms:1500}") long slowRequestThresholdMs
    ) {
        this.slowRequestThresholdMs = slowRequestThresholdMs;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = resolveRequestId(request);
        long startedAt = System.nanoTime();

        MDC.put(MDC_REQUEST_ID, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000L;
            logIfSlowOrFailed(request, response, requestId, durationMs);
            MDC.remove(MDC_REQUEST_ID);
        }
    }

    private String resolveRequestId(HttpServletRequest request) {
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return requestId.trim();
    }

    private void logIfSlowOrFailed(
            HttpServletRequest request,
            HttpServletResponse response,
            String requestId,
            long durationMs
    ) {
        int status = response.getStatus();
        if (status < 500 && durationMs < slowRequestThresholdMs) {
            return;
        }

        String storeId = headerValue(request, "X-Store-ID");
        String tenantId = headerValue(request, "X-Tenant-ID");
        String tenantSlug = headerValue(request, "X-Tenant-Slug");

        log.warn(
                "request_diagnostics requestId={} method={} path={} status={} durationMs={} storeId={} tenantId={} tenantSlug={}",
                requestId,
                request.getMethod(),
                request.getRequestURI(),
                status,
                durationMs,
                storeId,
                tenantId,
                tenantSlug
        );
    }

    private String headerValue(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        if (value == null || value.isBlank()) {
            return "-";
        }
        return value.trim();
    }
}
