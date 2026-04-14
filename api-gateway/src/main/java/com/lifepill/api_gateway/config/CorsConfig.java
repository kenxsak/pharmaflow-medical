package com.lifepill.api_gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS Configuration for API Gateway.
 * 
 * Provides centralized CORS configuration for all downstream services.
 * All values are externalized to environment variables.
 */
@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:*}")
    private String allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,PATCH,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${cors.allowed-headers:Authorization,Content-Type,Accept,Origin,X-Requested-With}")
    private String allowedHeaders;

    @Value("${cors.exposed-headers:Authorization,X-Response-Time,X-Request-Id}")
    private String exposedHeaders;

    @Value("${cors.allow-credentials:false}")
    private boolean allowCredentials;

    @Value("${cors.max-age:3600}")
    private long maxAge;

    /**
     * Configures CORS for the API Gateway.
     * This configuration applies to all routes passing through the gateway.
     * Gateway is the ONLY source of CORS headers - downstream services must not add CORS.
     * 
     * @return CorsWebFilter with production-ready CORS settings
     */
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Use allowedOriginPatterns instead of allowedOrigins to support credentials with wildcards
        if (allowedOrigins.equals("*")) {
            corsConfig.addAllowedOriginPattern("*");
        } else {
            Arrays.stream(allowedOrigins.split(",")).forEach(corsConfig::addAllowedOrigin);
        }
        
        // Always allow "null" origin for local file testing (file://)
        corsConfig.addAllowedOrigin("null");
        
        // Allowed HTTP methods from environment
        corsConfig.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));
        
        // Allow all headers for WebSocket
        corsConfig.addAllowedHeader("*");
        
        // Exposed headers from environment
        corsConfig.setExposedHeaders(Arrays.asList(exposedHeaders.split(",")));
        
        // Configure credentials support from environment
        corsConfig.setAllowCredentials(allowCredentials);
        
        // Cache preflight response
        corsConfig.setMaxAge(maxAge);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply CORS to ALL paths including WebSocket paths
        // Gateway is the ONLY source of CORS headers - downstream services must NOT add CORS
        source.registerCorsConfiguration("/**", corsConfig);
        
        return new CorsWebFilter(source);
    }
}
