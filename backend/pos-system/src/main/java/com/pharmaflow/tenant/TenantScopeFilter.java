package com.pharmaflow.tenant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.common.ApiErrorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
@Component
@RequiredArgsConstructor
public class TenantScopeFilter extends OncePerRequestFilter {

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
            writeError(response, exception.getMessage());
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

    private void writeError(HttpServletResponse response, String message) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiErrorResponse payload = ApiErrorResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .code("TENANT_SCOPE_FORBIDDEN")
                .message(message)
                .build();
        objectMapper.writeValue(response.getWriter(), payload);
    }
}
