package com.lifepill.api_gateway.security;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Route Validator for determining public endpoints and required roles.
 */
@Component
public class RouteValidator {

    /**
     * List of endpoints that don't require authentication.
     */
    private static final List<String> OPEN_ENDPOINTS = List.of(
            // Authentication endpoints
            "/lifepill/v1/auth",
            "/lifepill/v1/identity/auth",
            "/api/v1/auth",
            "/api/v1/user/auth",  // Mobile user auth endpoints
            // Password reset endpoints (public - no auth required)
            "/lifepill/v1/employer/forgot-password",
            "/lifepill/v1/employer/reset-password",
            "/lifepill/v1/identity/employer/forgot-password",
            "/lifepill/v1/identity/employer/reset-password",
            // Session authenticate (PIN login)
            "/lifepill/v1/session/authenticate/cached",
            "/lifepill/v1/session/get-cached-employer",
            "/lifepill/v1/session/get-all-cached-employers",
            "/lifepill/v1/session/check",
            "/lifepill/v1/session/logout",
            // WebSocket endpoints (authentication handled by WebSocket interceptor)
            "/ws",
            // Swagger/API docs
            "/swagger-ui",
            "/v3/api-docs",
            "/api-docs",
            "/swagger-ui.html",
            // Actuator health
            "/actuator/health",
            "/actuator/info",
            // Fallback endpoints
            "/fallback"
    );

    /**
     * Role requirements for specific paths.
     * Format: path pattern -> minimum role required
     * Role hierarchy: OWNER > MANAGER > CASHIER > USER > OTHER
     */
    private static final Map<String, PathRoleConfig> PATH_ROLE_REQUIREMENTS = Map.ofEntries(
            // Branch Service - OWNER full access, MANAGER own branch only
            Map.entry("/lifepill/v1/branch", new PathRoleConfig("MANAGER", Map.of(
                    "GET", "CASHIER",  // Cashiers can read branch info
                    "POST", "OWNER",   // Only owners can create branches
                    "PUT", "MANAGER",  // Managers can update
                    "DELETE", "OWNER"  // Only owners can delete
            ))),
            
            // Employer endpoints - OWNER and MANAGER access
            Map.entry("/lifepill/v1/employer", new PathRoleConfig("MANAGER", Map.of(
                    "GET", "CASHIER",  // Cashiers can read some employer info
                    "POST", "MANAGER", // Managers can create employees
                    "PUT", "MANAGER",
                    "DELETE", "OWNER"
            ))),
            
            // Session management
            Map.entry("/lifepill/v1/session", new PathRoleConfig("CASHIER", null)),
            
            // Inventory - Item endpoints
            Map.entry("/lifepill/v1/item", new PathRoleConfig("USER", Map.of(
                    "GET", "USER",     // Users can view items
                    "POST", "MANAGER", // Only managers can create items
                    "PUT", "MANAGER",
                    "DELETE", "OWNER"
            ))),
            
            // Inventory - Category endpoints
            Map.entry("/lifepill/v1/category", new PathRoleConfig("USER", Map.of(
                    "GET", "USER",
                    "POST", "MANAGER",
                    "PUT", "MANAGER",
                    "DELETE", "OWNER"
            ))),
            
            // Inventory - Supplier endpoints (OWNER and MANAGER only)
            Map.entry("/lifepill/v1/supplier", new PathRoleConfig("MANAGER", null)),
            Map.entry("/lifepill/v1/supplier-company", new PathRoleConfig("MANAGER", null)),
            
            // Order Service
            Map.entry("/lifepill/v1/order", new PathRoleConfig("USER", Map.of(
                    "GET", "USER",
                    "POST", "USER",    // Users can create orders
                    "PUT", "CASHIER",
                    "DELETE", "MANAGER"
            ))),
            
            // Customer Service (Mobile Users)
            Map.entry("/api/v1/customers", new PathRoleConfig("USER", null)),
            Map.entry("/api/v1/prescriptions", new PathRoleConfig("USER", null)),
            Map.entry("/api/v1/medical-records", new PathRoleConfig("USER", null)),
            
            // Patient Customer Service
            Map.entry("/lifepill/v1/customer", new PathRoleConfig("USER", null)),
            
            // Mobile User API - Allow authenticated access without role enforcement
            Map.entry("/api/v1/user", new PathRoleConfig(null, null)),
            
            // Mobile Medicine Search - Allow authenticated access without role enforcement
            Map.entry("/lifepill/v1/mobile", new PathRoleConfig(null, null)),
            
            // Prescription Service - Authenticated access without role enforcement (mobile users)
            Map.entry("/lifepill/v1/prescription", new PathRoleConfig(null, null)),
            
            // Notification Service - Authenticated access without role enforcement
            Map.entry("/api/v1/notifications", new PathRoleConfig(null, null)),
            Map.entry("/lifepill/v1/notifications", new PathRoleConfig(null, null)),
            
            // Mobile Orders - User authenticated access
            Map.entry("/lifepill/v1/mobile/orders", new PathRoleConfig("USER", null))
    );

    /**
     * Checks if the given path is a public endpoint.
     */
    public boolean isOpenEndpoint(String path) {
        return OPEN_ENDPOINTS.stream()
                .anyMatch(path::startsWith);
    }

    /**
     * Gets the minimum required role for a given path and HTTP method.
     */
    public String getRequiredMinimumRole(String path, String method) {
        for (Map.Entry<String, PathRoleConfig> entry : PATH_ROLE_REQUIREMENTS.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                PathRoleConfig config = entry.getValue();
                
                // Check method-specific role first
                if (config.methodRoles() != null && config.methodRoles().containsKey(method)) {
                    return config.methodRoles().get(method);
                }
                
                // Fall back to default role
                return config.defaultRole();
            }
        }
        
        // Default: require at least OTHER role (authenticated)
        return "OTHER";
    }

    /**
     * Configuration for path-based role requirements.
     */
    private record PathRoleConfig(String defaultRole, Map<String, String> methodRoles) {}
}
