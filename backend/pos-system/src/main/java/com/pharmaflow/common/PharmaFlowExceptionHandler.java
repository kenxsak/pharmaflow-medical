package com.pharmaflow.common;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;

@Order(Ordered.HIGHEST_PRECEDENCE)
@RestControllerAdvice(basePackages = "com.pharmaflow")
public class PharmaFlowExceptionHandler {

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessRuleException(BusinessRuleException exception) {
        return ResponseEntity.badRequest()
                .body(ApiErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .code("BUSINESS_RULE_ERROR")
                        .message(exception.getMessage())
                        .build());
    }

    @ExceptionHandler(ForbiddenActionException.class)
    public ResponseEntity<ApiErrorResponse> handleForbiddenActionException(ForbiddenActionException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiErrorResponse.builder()
                        .status(HttpStatus.FORBIDDEN.value())
                        .code("FORBIDDEN_ACTION")
                        .message(exception.getMessage())
                        .build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(IllegalArgumentException exception) {
        return ResponseEntity.badRequest()
                .body(ApiErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .code("INVALID_REQUEST")
                        .message(exception.getMessage())
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValidException(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse("Request validation failed");

        return ResponseEntity.badRequest()
                .body(ApiErrorResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .code("VALIDATION_ERROR")
                        .message(message)
                        .build());
    }
}
