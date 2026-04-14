package com.lifepill.api_gateway.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Global Authorization Filter for API Gateway.
 * Validates JWT tokens and enforces role-based access control.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthorizationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;
    private final RouteValidator routeValidator;

    private static final String AUTH_HEADER = HttpHeaders.AUTHORIZATION;
    private static final String BEARER_PREFIX = "Bearer ";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().toString();
        String method = request.getMethod().name();

        log.debug("Authorization filter processing: {} {}", method, path);

        // Check if route is public (no auth required)
        if (routeValidator.isOpenEndpoint(path)) {
            log.debug("Public endpoint - no auth required: {}", path);
            return chain.filter(exchange);
        }

        // Get authorization header
        String authHeader = request.getHeaders().getFirst(AUTH_HEADER);
        
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            log.warn("Missing or invalid Authorization header for: {}", path);
            return onError(exchange, "Missing or invalid Authorization header", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);

        // Validate token
        if (!jwtUtil.isTokenValid(token)) {
            log.warn("Invalid or expired token for: {}", path);
            return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }

        // Check role-based authorization
        String requiredMinimumRole = routeValidator.getRequiredMinimumRole(path, method);
        
        if (requiredMinimumRole != null && !jwtUtil.hasMinimumRole(token, requiredMinimumRole)) {
            log.warn("Access denied for path: {} - User does not have required role: {}", path, requiredMinimumRole);
            return onError(exchange, "Access denied - Insufficient permissions", HttpStatus.FORBIDDEN);
        }

        // Add user info to headers for downstream services
        String username = jwtUtil.extractUsername(token);
        List<String> roles = jwtUtil.extractRoles(token);
        
        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-Auth-User", username)
                .header("X-Auth-Roles", roles != null ? String.join(",", roles) : "")
                .header("X-Auth-Validated", "true")
                .build();

        log.debug("Authorization successful for user: {} accessing: {}", username, path);
        
        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");
        
        String body = String.format("{\"code\":%d,\"message\":\"%s\",\"data\":null}", 
                status.value(), message);
        
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }

    @Override
    public int getOrder() {
        // Execute after AuthenticationRelayFilter but before routing
        return Ordered.HIGHEST_PRECEDENCE + 2;
    }
}
