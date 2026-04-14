package com.lifepill.api_gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.function.Function;

/**
 * JWT utility class for token validation at API Gateway level.
 */
@Component
@Slf4j
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secretKey;

    /**
     * Extracts the username (subject) from the JWT token.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extracts roles from the JWT token.
     */
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("roles", List.class);
    }

    /**
     * Extracts a specific claim from the JWT token.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Validates if the token is not expired.
     */
    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            log.error("JWT validation error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Checks if the user has the required role.
     */
    public boolean hasRole(String token, String requiredRole) {
        List<String> roles = extractRoles(token);
        if (roles == null) return false;
        
        // Check for exact role match (e.g., ROLE_OWNER)
        String roleWithPrefix = requiredRole.startsWith("ROLE_") ? requiredRole : "ROLE_" + requiredRole;
        return roles.contains(roleWithPrefix);
    }

    /**
     * Checks if the user has any of the required roles based on hierarchy.
     * Role hierarchy: OWNER > MANAGER > CASHIER > USER > OTHER
     */
    public boolean hasAnyRole(String token, String... requiredRoles) {
        List<String> userRoles = extractRoles(token);
        if (userRoles == null) return false;

        for (String requiredRole : requiredRoles) {
            String roleWithPrefix = requiredRole.startsWith("ROLE_") ? requiredRole : "ROLE_" + requiredRole;
            if (userRoles.contains(roleWithPrefix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if user role is at or above the required level in hierarchy.
     * OWNER > MANAGER > CASHIER > USER > OTHER
     */
    public boolean hasMinimumRole(String token, String minimumRole) {
        List<String> userRoles = extractRoles(token);
        if (userRoles == null) return false;

        int requiredLevel = getRoleLevel(minimumRole);
        
        for (String role : userRoles) {
            String cleanRole = role.replace("ROLE_", "");
            if (getRoleLevel(cleanRole) >= requiredLevel) {
                return true;
            }
        }
        return false;
    }

    /**
     * Gets the hierarchy level of a role.
     * Higher number = higher privilege.
     */
    private int getRoleLevel(String role) {
        String cleanRole = role.replace("ROLE_", "").toUpperCase();
        return switch (cleanRole) {
            case "OWNER" -> 5;
            case "MANAGER" -> 4;
            case "CASHIER" -> 3;
            case "USER" -> 2;
            case "OTHER" -> 1;
            default -> 0;
        };
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
