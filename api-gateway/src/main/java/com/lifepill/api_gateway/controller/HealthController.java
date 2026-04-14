package com.lifepill.api_gateway.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Health Check Controller for API Gateway.
 * 
 * Provides comprehensive health information about the gateway
 * and registered services.
 */
@Slf4j
@RestController
@RequestMapping("/gateway")
@RequiredArgsConstructor
public class HealthController {

    private final DiscoveryClient discoveryClient;

    /**
     * Gateway health check endpoint.
     * 
     * @return Health status of the gateway
     */
    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "API-GATEWAY");
        health.put("timestamp", LocalDateTime.now().toString());
        
        return Mono.just(ResponseEntity.ok(health));
    }

    /**
     * Returns list of all registered services.
     * 
     * @return List of registered service names and their instances
     */
    @GetMapping("/services")
    public Mono<ResponseEntity<Map<String, Object>>> registeredServices() {
        Map<String, Object> response = new HashMap<>();
        
        List<String> services = discoveryClient.getServices();
        Map<String, List<String>> serviceDetails = new HashMap<>();
        
        for (String service : services) {
            List<ServiceInstance> instances = discoveryClient.getInstances(service);
            List<String> instanceUrls = instances.stream()
                    .map(instance -> instance.getUri().toString())
                    .collect(Collectors.toList());
            serviceDetails.put(service, instanceUrls);
        }
        
        response.put("services", serviceDetails);
        response.put("totalServices", services.size());
        response.put("timestamp", LocalDateTime.now().toString());
        
        return Mono.just(ResponseEntity.ok(response));
    }

    /**
     * Gateway info endpoint.
     * 
     * @return Gateway metadata and version info
     */
    @GetMapping("/info")
    public Mono<ResponseEntity<Map<String, Object>>> info() {
        Map<String, Object> info = new HashMap<>();
        info.put("name", "LifePill API Gateway");
        info.put("version", "v1.0.0");
        info.put("description", "Production-grade API Gateway for LifePill Microservices");
        info.put("documentation", "/swagger-ui.html");
        info.put("timestamp", LocalDateTime.now().toString());
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("health", "/gateway/health");
        endpoints.put("services", "/gateway/services");
        endpoints.put("actuator", "/actuator");
        endpoints.put("metrics", "/actuator/prometheus");
        info.put("endpoints", endpoints);
        
        return Mono.just(ResponseEntity.ok(info));
    }
}
