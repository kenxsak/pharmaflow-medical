package com.lifepill.api_gateway.config;

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.circuitbreaker.resilience4j.ReactiveResilience4JCircuitBreakerFactory;
import org.springframework.cloud.circuitbreaker.resilience4j.Resilience4JConfigBuilder;
import org.springframework.cloud.client.circuitbreaker.Customizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Resilience4j Circuit Breaker configuration for API Gateway.
 * All values are externalized to environment variables.
 * 
 * Implements the Circuit Breaker pattern
 */
@Configuration
public class CircuitBreakerConfiguration {

    // Default Circuit Breaker Configuration
    @Value("${circuitbreaker.default.sliding-window-size:10}")
    private int defaultSlidingWindowSize;

    @Value("${circuitbreaker.default.failure-rate-threshold:50}")
    private float defaultFailureRateThreshold;

    @Value("${circuitbreaker.default.wait-duration-open-state:10}")
    private long defaultWaitDurationInOpenState;

    @Value("${circuitbreaker.default.permitted-calls-half-open:5}")
    private int defaultPermittedCallsInHalfOpen;

    @Value("${circuitbreaker.default.slow-call-rate-threshold:50}")
    private float defaultSlowCallRateThreshold;

    @Value("${circuitbreaker.default.slow-call-duration-threshold:2}")
    private long defaultSlowCallDurationThreshold;

    @Value("${circuitbreaker.default.timeout-duration:5}")
    private long defaultTimeoutDuration;

    // Auth Service Circuit Breaker Configuration
    @Value("${circuitbreaker.auth.sliding-window-size:5}")
    private int authSlidingWindowSize;

    @Value("${circuitbreaker.auth.failure-rate-threshold:40}")
    private float authFailureRateThreshold;

    @Value("${circuitbreaker.auth.wait-duration-open-state:15}")
    private long authWaitDurationInOpenState;

    @Value("${circuitbreaker.auth.permitted-calls-half-open:3}")
    private int authPermittedCallsInHalfOpen;

    @Value("${circuitbreaker.auth.slow-call-rate-threshold:40}")
    private float authSlowCallRateThreshold;

    @Value("${circuitbreaker.auth.slow-call-duration-threshold:3}")
    private long authSlowCallDurationThreshold;

    @Value("${circuitbreaker.auth.timeout-duration:10}")
    private long authTimeoutDuration;

    /**
     * Default circuit breaker configuration applied to all services.
     * 
     * @return Customizer for ReactiveResilience4JCircuitBreakerFactory
     */
    @Bean
    public Customizer<ReactiveResilience4JCircuitBreakerFactory> defaultCustomizer() {
        return factory -> factory.configureDefault(id -> new Resilience4JConfigBuilder(id)
                .circuitBreakerConfig(CircuitBreakerConfig.custom()
                        .slidingWindowSize(defaultSlidingWindowSize)
                        .failureRateThreshold(defaultFailureRateThreshold)
                        .waitDurationInOpenState(Duration.ofSeconds(defaultWaitDurationInOpenState))
                        .permittedNumberOfCallsInHalfOpenState(defaultPermittedCallsInHalfOpen)
                        .slowCallRateThreshold(defaultSlowCallRateThreshold)
                        .slowCallDurationThreshold(Duration.ofSeconds(defaultSlowCallDurationThreshold))
                        .build())
                .timeLimiterConfig(TimeLimiterConfig.custom()
                        .timeoutDuration(Duration.ofSeconds(defaultTimeoutDuration))
                        .build())
                .build());
    }

    /**
     * Custom circuit breaker for User Auth Service with stricter settings.
     * Auth operations are critical and should fail fast.
     * 
     * @return Customizer for auth service circuit breaker
     */
    @Bean
    public Customizer<ReactiveResilience4JCircuitBreakerFactory> authServiceCustomizer() {
        return factory -> factory.configure(builder -> builder
                        .circuitBreakerConfig(CircuitBreakerConfig.custom()
                                .slidingWindowSize(authSlidingWindowSize)
                                .failureRateThreshold(authFailureRateThreshold)
                                .waitDurationInOpenState(Duration.ofSeconds(authWaitDurationInOpenState))
                                .permittedNumberOfCallsInHalfOpenState(authPermittedCallsInHalfOpen)
                                .slowCallRateThreshold(authSlowCallRateThreshold)
                                .slowCallDurationThreshold(Duration.ofSeconds(authSlowCallDurationThreshold))
                                .build())
                        .timeLimiterConfig(TimeLimiterConfig.custom()
                                .timeoutDuration(Duration.ofSeconds(authTimeoutDuration))
                                .build()),
                "userAuthCircuitBreaker");
    }
}
