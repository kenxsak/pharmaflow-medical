package com.lifepill.api_gateway.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Gateway Route Configuration for LifePill Microservices.
 * 
 * Routes are organized by service domain for maintainability.
 * All URIs and paths are externalized to environment variables.
 */
@Slf4j
@Configuration
public class GatewayRouteConfig {

    @Value("${gateway.services.user-auth.name:MOBILE-USER-AUTH-SERVICE}")
    private String userAuthServiceName;

    @Value("${gateway.services.config-server.name:CONFIG-SERVER}")
    private String configServerName;

    @Value("${gateway.services.eureka.uri:http://localhost:8761}")
    private String eurekaUri;

    @Value("${api.version:v1}")
    private String apiVersion;

    @Value("${gateway.headers.source:lifepill-gateway}")
    private String gatewayHeaderSource;

    @Value("${gateway.routes.retry-count:3}")
    private int retryCount;

    @Value("${gateway.services.identity-service.name:IDENTITY-SERVICE}")
    private String identityServiceName;

    @Value("${gateway.paths.identity.auth:/lifepill/v1/auth/**}")
    private String identityAuthPath;

    @Value("${gateway.paths.identity.session:/lifepill/v1/session/**}")
    private String identitySessionPath;

    @Value("${gateway.paths.identity.employer:/lifepill/v1/employer/**}")
    private String identityEmployerPath;

    /**
     * Configures all gateway routes for the LifePill ecosystem.
     * 
     * @param builder RouteLocatorBuilder provided by Spring Cloud Gateway
     * @return RouteLocator containing all route definitions
     */
    @Bean
    public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
        String authPath = "/api/" + apiVersion + "/auth/**";
        String userPath = "/api/" + apiVersion + "/user/**";
        
        log.info("Configuring gateway routes with API version: {}", apiVersion);
        log.info("Auth path: {}, User path: {}", authPath, userPath);
        
        return builder.routes()
                // Auth Routes - /api/v1/auth/**
                .route("user-auth-service", r -> r
                        .path(authPath)
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("userAuthCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/auth"))
                                .retry(retryConfig -> retryConfig
                                        .setRetries(retryCount)
                                        .setStatuses(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                                                org.springframework.http.HttpStatus.BAD_GATEWAY))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource)
                                .addResponseHeader("X-Response-Time", String.valueOf(System.currentTimeMillis())))
                        .uri("lb://" + userAuthServiceName))

                // Identity Service Direct Auth
                .route("identity-service-direct-auth", r -> r
                        .path(identityAuthPath)
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("identityServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/identity"))
                                .retry(retryConfig -> retryConfig
                                        .setRetries(retryCount)
                                        .setStatuses(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                                                org.springframework.http.HttpStatus.BAD_GATEWAY))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://" + identityServiceName))

                // Identity Service Session Routes
                .route("identity-service-session", r -> r
                        .path(identitySessionPath)
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("identityServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/identity"))
                                .retry(retryConfig -> retryConfig
                                        .setRetries(retryCount)
                                        .setStatuses(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                                                org.springframework.http.HttpStatus.BAD_GATEWAY))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://" + identityServiceName))

                // Identity Service Employer Routes
                .route("identity-service-employer", r -> r
                        .path(identityEmployerPath)
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("identityServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/identity"))
                                .retry(retryConfig -> retryConfig
                                        .setRetries(retryCount)
                                        .setStatuses(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                                                org.springframework.http.HttpStatus.BAD_GATEWAY))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://" + identityServiceName))
                
                // User Profile Routes - /api/v1/user/**
                .route("user-profile-service", r -> r
                        .path(userPath)
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("userAuthCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/user"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://" + userAuthServiceName))
                
                // Swagger/OpenAPI Documentation Routes for User Auth
                .route("user-auth-swagger", r -> r
                        .path("/api/v3/api-docs/**", "/api/swagger-ui/**", "/api/swagger-ui.html")
                        .filters(f -> f
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://" + userAuthServiceName))
                
                // Eureka Dashboard Routes
                .route("eureka-dashboard", r -> r
                        .path("/eureka/web")
                        .filters(f -> f.setPath("/"))
                        .uri(eurekaUri))
                
                .route("eureka-static", r -> r
                        .path("/eureka/**")
                        .uri(eurekaUri))
                
                // Config Server Routes
                .route("config-server", r -> r
                        .path("/config/**")
                        .filters(f -> f.rewritePath("/config/(?<segment>.*)", "/${segment}"))
                        .uri("lb://" + configServerName))

                // Branch Service Routes
                .route("branch-service", r -> r
                        .path("/lifepill/v1/branch/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("branchServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/branch"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://BRANCH-SERVICE"))

                // Branch Manager Routes
                .route("branch-manager-service", r -> r
                        .path("/lifepill/v1/branch-manager/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("branchManagerServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/branch"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://BRANCH-SERVICE"))

                // Inventory Service - Supplier Company Routes (higher priority - more specific path)
                .route("inventory-service-supplier-company", r -> r
                        .path("/lifepill/v1/supplier-company/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("inventoryServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/inventory"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://INVENTORY-SERVICE"))

                // Inventory Service - Supplier Routes (generic)
                .route("inventory-service-suppliers", r -> r
                        .path("/lifepill/v1/supplier/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("inventoryServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/inventory"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://INVENTORY-SERVICE"))

                // Inventory Service - Item Routes
                .route("inventory-service-items", r -> r
                        .path("/lifepill/v1/item/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("inventoryServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/inventory"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://INVENTORY-SERVICE"))

                // Inventory Service - Category Routes
                .route("inventory-service-categories", r -> r
                        .path("/lifepill/v1/category/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("inventoryServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/inventory"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://INVENTORY-SERVICE"))

                // Order Service Routes
                .route("order-service-orders", r -> r
                        .path("/lifepill/v1/order/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("orderServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/order"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://ORDER-SERVICE"))

                // Sales Service Routes (part of Order Service)
                .route("order-service-sales", r -> r
                        .path("/lifepill/v1/sales/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("orderServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/order"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://ORDER-SERVICE"))

                // Customer Service - Mobile API Routes
                .route("customer-service-mobile", r -> r
                        .path("/lifepill/v1/mobile/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("customerServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/customer"))
                                .retry(retryConfig -> retryConfig
                                        .setRetries(retryCount)
                                        .setStatuses(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                                                org.springframework.http.HttpStatus.BAD_GATEWAY))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://CUSTOMER-SERVICE"))

                // Prescription Service Routes
                .route("prescription-service-upload", r -> r
                        .path("/lifepill/v1/prescription/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("prescriptionServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/prescription"))
                                .retry(retryConfig -> retryConfig
                                        .setRetries(retryCount)
                                        .setStatuses(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                                                org.springframework.http.HttpStatus.BAD_GATEWAY))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://PRESCRIPTION-SERVICE"))

                // Notification Service WebSocket - Pass through without modification
                .route("notification-websocket", r -> r
                        .path("/ws/**")
                        .filters(f -> f
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://NOTIFICATION-SERVICE"))

                // Notification Service REST API
                .route("notification-service-api", r -> r
                        .path("/api/v1/notifications/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("notificationServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/notification"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://NOTIFICATION-SERVICE"))

                // Notification Service - Device Registration (FCM tokens)
                .route("notification-devices", r -> r
                        .path("/lifepill/v1/notifications/devices/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("notificationServiceCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/notification"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://NOTIFICATION-SERVICE"))

                // Mobile Orders API (Customer Service)
                .route("mobile-orders-api", r -> r
                        .path("/lifepill/v1/mobile/orders/**")
                        .filters(f -> f
                                .circuitBreaker(c -> c
                                        .setName("mobileOrdersCircuitBreaker")
                                        .setFallbackUri("forward:/fallback/customer"))
                                .addRequestHeader("X-Gateway-Source", gatewayHeaderSource))
                        .uri("lb://CUSTOMER-SERVICE"))

                .build();
    }
}
