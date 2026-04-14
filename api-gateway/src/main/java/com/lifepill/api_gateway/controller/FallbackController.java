package com.lifepill.api_gateway.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Fallback Controller for Circuit Breaker.
 * 
 * Provides graceful degradation when downstream services are unavailable.
 * Uses @RequestMapping without method restriction to handle ALL HTTP methods
 * (GET, POST, PUT, DELETE, PATCH, etc.) which is critical for multipart/form-data endpoints.
 * 
 * Fallback responses provide:
 * - User-friendly error messages
 * - Appropriate HTTP status codes
 * - Structured error response format
 */
@Slf4j
@RestController
@RequestMapping("/fallback")
public class FallbackController {

    /**
     * Generic service fallback handler.
     * Handles ALL HTTP methods (GET, POST, PUT, DELETE, PATCH, etc.)
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with error details
     */
    @RequestMapping(value = "/service", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> serviceFallback(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().value();
        log.warn("Service fallback triggered - downstream service unavailable. Method: {}, Path: {}", method, path);
        
        Map<String, Object> response = createFallbackResponse(
                "SERVICE_UNAVAILABLE",
                "The requested service is temporarily unavailable. Please try again later.",
                "service",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    /**
     * Authentication service fallback handler.
     * Handles ALL HTTP methods for auth endpoints.
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with auth-specific error
     */
    @RequestMapping(value = "/auth", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> authFallback(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().value();
        log.warn("Auth service fallback triggered - authentication service unavailable. Method: {}, Path: {}", method, path);
        
        Map<String, Object> response = createFallbackResponse(
                "AUTH_SERVICE_UNAVAILABLE",
                "Authentication service is temporarily unavailable. Please try again in a few moments.",
                "auth",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    /**
     * User service fallback handler.
     * Handles ALL HTTP methods for user endpoints.
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with user service error
     */
    @RequestMapping(value = "/user", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> userFallback(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().value();
        log.warn("User service fallback triggered - user service unavailable. Method: {}, Path: {}", method, path);
        
        Map<String, Object> response = createFallbackResponse(
                "USER_SERVICE_UNAVAILABLE",
                "User service is temporarily unavailable. Your data is safe. Please try again later.",
                "user",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    /**
     * Inventory service fallback handler.
     * Handles ALL HTTP methods including POST for multipart/form-data uploads.
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with inventory service error
     */
    @RequestMapping(value = "/inventory", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> inventoryFallback(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().value();
        log.warn("Inventory service fallback triggered - inventory service unavailable. Method: {}, Path: {}", method, path);
        
        Map<String, Object> response = createFallbackResponse(
                "INVENTORY_SERVICE_UNAVAILABLE",
                "Inventory service is temporarily unavailable. Please try again later.",
                "inventory",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    /**
     * Branch service fallback handler.
     * Handles ALL HTTP methods for branch endpoints.
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with branch service error
     */
    @RequestMapping(value = "/branch", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> branchFallback(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().value();
        log.warn("Branch service fallback triggered - branch service unavailable. Method: {}, Path: {}", method, path);
        
        Map<String, Object> response = createFallbackResponse(
                "BRANCH_SERVICE_UNAVAILABLE",
                "Branch service is temporarily unavailable. Please try again later.",
                "branch",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    /**
     * Order service fallback handler.
     * Handles ALL HTTP methods for order endpoints.
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with order service error
     */
    @RequestMapping(value = "/order", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> orderFallback(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().value();
        log.warn("Order service fallback triggered - order service unavailable. Method: {}, Path: {}", method, path);
        
        Map<String, Object> response = createFallbackResponse(
                "ORDER_SERVICE_UNAVAILABLE",
                "Order service is temporarily unavailable. Please try again later.",
                "order",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    /**
     * Identity service fallback handler.
     * Handles ALL HTTP methods for identity endpoints including employer image uploads.
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with identity service error
     */
    @RequestMapping(value = "/identity", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> identityFallback(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().value();
        log.warn("Identity service fallback triggered - identity service unavailable. Method: {}, Path: {}", method, path);
        
        Map<String, Object> response = createFallbackResponse(
                "IDENTITY_SERVICE_UNAVAILABLE",
                "Identity service is temporarily unavailable. Please try again later.",
                "identity",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    /**
     * Customer service fallback handler.
     * Handles ALL HTTP methods for customer/patient endpoints.
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with customer service error
     */
    @RequestMapping(value = "/customer", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> customerFallback(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().value();
        log.warn("Customer service fallback triggered - customer service unavailable. Method: {}, Path: {}", method, path);
        
        Map<String, Object> response = createFallbackResponse(
                "CUSTOMER_SERVICE_UNAVAILABLE",
                "Customer service is temporarily unavailable. Please try again later.",
                "customer",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    /**
     * Prescription service fallback handler.
     * Handles ALL HTTP methods for prescription endpoints including image uploads.
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with prescription service error
     */
    @RequestMapping(value = "/prescription", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> prescriptionFallback(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().value();
        log.warn("Prescription service fallback triggered - prescription service unavailable. Method: {}, Path: {}", method, path);
        
        Map<String, Object> response = createFallbackResponse(
                "PRESCRIPTION_SERVICE_UNAVAILABLE",
                "Prescription service is temporarily unavailable. Please try again later.",
                "prescription",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    /**
     * Notification service fallback handler.
     * Handles ALL HTTP methods for notification and WebSocket endpoints.
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with notification service error
     */
    @RequestMapping(value = "/notification", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> notificationFallback(ServerWebExchange exchange) {
        String method = exchange.getRequest().getMethod().name();
        String path = exchange.getRequest().getPath().value();
        log.warn("Notification service fallback triggered - notification service unavailable. Method: {}, Path: {}", method, path);
        
        Map<String, Object> response = createFallbackResponse(
                "NOTIFICATION_SERVICE_UNAVAILABLE",
                "Notification service is temporarily unavailable. Please try again later.",
                "notification",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response));
    }

    /**
     * Rate limit exceeded fallback.
     * Handles ALL HTTP methods.
     * 
     * @param exchange ServerWebExchange to extract request details
     * @return Mono<ResponseEntity<Map<String, Object>>> with rate limit error
     */
    @RequestMapping(value = "/rate-limited", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseEntity<Map<String, Object>>> rateLimitFallback(ServerWebExchange exchange) {
        String path = exchange.getRequest().getPath().value();
        log.warn("Rate limit fallback triggered");
        
        Map<String, Object> response = createFallbackResponse(
                "RATE_LIMIT_EXCEEDED",
                "Too many requests. Please slow down and try again later.",
                "rate-limit",
                path
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response));
    }

    /**
     * Creates a standardized fallback response.
     * 
     * @param code Error code for client handling
     * @param message Human-readable error message
     * @param source Service source of the fallback
     * @param path Original request path
     * @return Map containing structured error response
     */
    private Map<String, Object> createFallbackResponse(String code, String message, String source, String path) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", code);
        response.put("message", message);
        response.put("source", source);
        response.put("path", path);
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("suggestion", "If this problem persists, please contact support@lifepill.com");
        
        return response;
    }
}
