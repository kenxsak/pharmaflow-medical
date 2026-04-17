package com.pharmaflow.tenant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.common.BusinessRuleException;
import com.pharmaflow.common.ForbiddenActionException;
import com.pharmaflow.common.ApiErrorResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLTransientConnectionException;

@Component
@RequiredArgsConstructor
public class TenantScopeFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(TenantScopeFilter.class);

    private final CurrentPharmaUserService currentPharmaUserService;
    private final TenantAccessService tenantAccessService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            if (shouldNotFilter(request)) {
                filterChain.doFilter(request, response);
                return;
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getName() == null) {
                filterChain.doFilter(request, response);
                return;
            }

            PharmaUser user = currentPharmaUserService.getCurrentUser();
            if (user == null) {
                filterChain.doFilter(request, response);
                return;
            }

            String storeIdCandidate = request.getHeader("X-Store-ID");
            if (storeIdCandidate == null || storeIdCandidate.isBlank()) {
                storeIdCandidate = request.getParameter("storeId");
            }

            TenantRequestContext context = tenantAccessService.buildContext(
                    user,
                    request.getRequestURI(),
                    storeIdCandidate,
                    request.getRequestURI().startsWith("/api/v1/platform")
            );
            TenantRequestContextHolder.set(context);
            filterChain.doFilter(request, response);
        } catch (Exception exception) {
            handleTenantScopeFailure(request, response, exception);
        } finally {
            TenantRequestContextHolder.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null
                || !path.startsWith("/api/v1")
                || path.startsWith("/api/v1/auth");
    }

    private void handleTenantScopeFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            Exception exception
    ) throws IOException {
        if (exception instanceof ForbiddenActionException) {
            writeError(
                    response,
                    HttpStatus.FORBIDDEN,
                    "TENANT_SCOPE_FORBIDDEN",
                    exception.getMessage()
            );
            return;
        }

        if (exception instanceof BusinessRuleException || exception instanceof IllegalArgumentException) {
            writeError(
                    response,
                    HttpStatus.BAD_REQUEST,
                    "TENANT_SCOPE_INVALID",
                    exception.getMessage()
            );
            return;
        }

        if (isInfrastructureFailure(exception)) {
            logger.warn("Tenant scope validation temporarily unavailable for path {}", request.getRequestURI(), exception);
            writeError(
                    response,
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "TENANT_SCOPE_UNAVAILABLE",
                    "Tenant validation is temporarily unavailable. Please retry in a few seconds."
            );
            return;
        }

        logger.error("Unexpected tenant scope failure for path {}", request.getRequestURI(), exception);
        writeError(
                response,
                HttpStatus.INTERNAL_SERVER_ERROR,
                "TENANT_SCOPE_ERROR",
                "Unable to validate tenant access for this request."
        );
    }

    private boolean isInfrastructureFailure(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof CannotCreateTransactionException
                    || current instanceof CannotGetJdbcConnectionException
                    || current instanceof DataAccessException
                    || current instanceof SQLTransientConnectionException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String code, String message) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiErrorResponse payload = ApiErrorResponse.builder()
                .status(status.value())
                .code(code)
                .message(message)
                .build();
        objectMapper.writeValue(response.getWriter(), payload);
    }
}
