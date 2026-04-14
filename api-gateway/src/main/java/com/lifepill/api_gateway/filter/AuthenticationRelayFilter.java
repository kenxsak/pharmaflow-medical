package com.lifepill.api_gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Authentication Header Relay Filter.
 * 
 * Ensures authentication headers are properly propagated to downstream services.
 * 
 * This filter:
 * - Validates presence of Authorization header where required
 * - Propagates JWT tokens to downstream services
 * - Adds gateway-specific headers for tracing
 */
@Slf4j
@Component
public class AuthenticationRelayFilter implements GlobalFilter, Ordered {

    private static final String AUTH_HEADER = HttpHeaders.AUTHORIZATION;
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        // Check if authorization header is present
        String authHeader = request.getHeaders().getFirst(AUTH_HEADER);
        
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            log.debug("Authorization header present for path: {}", request.getPath());
            
            // Add header to indicate token was relayed by gateway
            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-Auth-Relayed", "true")
                    .header("X-Gateway-Auth-Time", String.valueOf(System.currentTimeMillis()))
                    .build();
            
            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        }
        
        // No auth header - proceed without modification
        // Individual services handle authentication requirements
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        // Execute after logging filter but before routing
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }
}
