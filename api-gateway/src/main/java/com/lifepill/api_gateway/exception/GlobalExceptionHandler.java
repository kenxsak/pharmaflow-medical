package com.lifepill.api_gateway.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

/**
 * Global Exception Handler for API Gateway.
 * 
 * Handles all uncaught exceptions and provides consistent error responses.
 */
@Slf4j
@Component
@Order(-2) // Execute before default Spring error handler
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        
        HttpStatus status;
        String errorCode;
        String message;
        
        if (ex instanceof ResponseStatusException rse) {
            status = HttpStatus.valueOf(rse.getStatusCode().value());
            errorCode = status.name();
            message = rse.getReason() != null ? rse.getReason() : status.getReasonPhrase();
        } else if (ex.getMessage() != null && ex.getMessage().contains("Connection refused")) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            errorCode = "SERVICE_UNAVAILABLE";
            message = "The requested service is currently unavailable. Please try again later.";
        } else if (ex.getMessage() != null && ex.getMessage().contains("timed out")) {
            status = HttpStatus.GATEWAY_TIMEOUT;
            errorCode = "GATEWAY_TIMEOUT";
            message = "The request timed out. Please try again.";
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            errorCode = "INTERNAL_ERROR";
            message = "An unexpected error occurred. Please try again later.";
        }
        
        log.error("Gateway Error: {} - {} - Path: {}", 
                errorCode, 
                ex.getMessage(), 
                exchange.getRequest().getPath());
        
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        
        String errorResponse = String.format(
                """
                {
                    "success": false,
                    "error": "%s",
                    "message": "%s",
                    "path": "%s",
                    "timestamp": "%s",
                    "status": %d
                }
                """,
                errorCode,
                message,
                exchange.getRequest().getPath(),
                LocalDateTime.now().toString(),
                status.value()
        );
        
        DataBuffer buffer = response.bufferFactory()
                .wrap(errorResponse.getBytes(StandardCharsets.UTF_8));
        
        return response.writeWith(Mono.just(buffer));
    }
}
