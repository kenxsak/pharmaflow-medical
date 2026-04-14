package com.lifepill.api_gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Global Request Logging Filter for API Gateway.
 * 
 * This filter adds:
 * - Unique request ID for distributed tracing
 * - Request timing metrics
 * - Detailed logging for debugging and monitoring
 */
@Slf4j
@Component
public class RequestLoggingFilter implements GlobalFilter, Ordered {

    private static final String REQUEST_ID_HEADER = "X-Request-Id";
    private static final String REQUEST_TIME_ATTRIBUTE = "requestStartTime";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Generate unique request ID
        String requestId = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();
        
        ServerHttpRequest request = exchange.getRequest();
        
        // Log incoming request
        log.info("==> Incoming Request: {} {} | RequestId: {} | Client: {}",
                request.getMethod(),
                request.getPath(),
                requestId,
                request.getRemoteAddress());
        
        // Add request ID to headers for downstream services
        ServerHttpRequest mutatedRequest = request.mutate()
                .header(REQUEST_ID_HEADER, requestId)
                .build();
        
        // Store start time for response timing
        exchange.getAttributes().put(REQUEST_TIME_ATTRIBUTE, startTime);
        
        return chain.filter(exchange.mutate().request(mutatedRequest).build())
                .doOnSuccess(aVoid -> logResponse(exchange, requestId, startTime))
                .doOnError(throwable -> logError(exchange, requestId, startTime, throwable));
    }

    private void logResponse(ServerWebExchange exchange, String requestId, long startTime) {
        long duration = System.currentTimeMillis() - startTime;
        int statusCode = exchange.getResponse().getStatusCode() != null 
                ? exchange.getResponse().getStatusCode().value() 
                : 0;
        
        log.info("<== Response: {} | Status: {} | Duration: {}ms | RequestId: {}",
                exchange.getRequest().getPath(),
                statusCode,
                duration,
                requestId);
        
        // Log slow requests for monitoring
        if (duration > 3000) {
            log.warn("SLOW REQUEST DETECTED: {} took {}ms | RequestId: {}",
                    exchange.getRequest().getPath(),
                    duration,
                    requestId);
        }
    }

    private void logError(ServerWebExchange exchange, String requestId, long startTime, Throwable throwable) {
        long duration = System.currentTimeMillis() - startTime;
        
        log.error("!!! Request Failed: {} | Duration: {}ms | RequestId: {} | Error: {}",
                exchange.getRequest().getPath(),
                duration,
                requestId,
                throwable.getMessage());
    }

    @Override
    public int getOrder() {
        // Execute early in the filter chain
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
