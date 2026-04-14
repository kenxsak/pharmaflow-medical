package com.lifepill.service_registry.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for Eureka Server.
 * 
 * Secures the Eureka dashboard and endpoints while allowing
 * service registration without authentication.
 * 
 * Following SOLID principles:
 * - Single Responsibility: Only handles security configuration
 * - Open/Closed: Can be extended via profiles
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Configures HTTP security for Eureka Server.
     * 
     * @param http HttpSecurity builder
     * @return SecurityFilterChain configured for Eureka
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // Disable CSRF for Eureka client registration
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // Allow health checks without authentication
                        .requestMatchers("/actuator/health/**").permitAll()
                        .requestMatchers("/actuator/info").permitAll()
                        .requestMatchers("/actuator/prometheus").permitAll()
                        // Allow Eureka client registration
                        .requestMatchers("/eureka/**").permitAll()
                        // Secure everything else (dashboard, other actuator endpoints)
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults())
                .build();
    }
}
