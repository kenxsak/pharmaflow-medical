package com.lifepill.api_gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * LifePill API Gateway Application.
 * 
 * This is the single entry point for all client requests to the LifePill microservices.
 * It provides:
 * - Request routing to appropriate microservices
 * - Load balancing via Eureka service discovery
 * - Circuit breaker pattern for fault tolerance
 * - Rate limiting for API protection
 * - Centralized CORS configuration
 * - Request/Response logging and metrics
 * 
 * Start Order: Service Registry -> Config Server -> API Gateway -> Other Services
 * 
 * @author LifePill Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

}
