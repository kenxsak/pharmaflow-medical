package com.lifepill.possystem.config;

import com.pharmaflow.auth.PharmaUserRepository;
import com.pharmaflow.tenant.TenantRepository;
import com.lifepill.possystem.repo.employerRepository.EmployerRepository;
import org.springframework.context.annotation.Configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuration class for application settings.
 */
@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final EmployerRepository employerRepository;
    private final PharmaUserRepository pharmaUserRepository;
    private final TenantRepository tenantRepository;

    /**
     * Provides an instance of BCryptPasswordEncoder for password encoding.
     *
     * @return BCryptPasswordEncoder instance
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Retrieves a user details service based on the employer's email.
     *
     * @return UserDetailsService implementation
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return loginKey -> employerRepository.findByEmployerEmail(loginKey)
                .map(user -> (org.springframework.security.core.userdetails.UserDetails) user)
                .or(() -> resolvePharmaUser(loginKey)
                        .map(user -> (org.springframework.security.core.userdetails.UserDetails) user))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    private java.util.Optional<com.pharmaflow.auth.PharmaUser> resolvePharmaUser(String loginKey) {
        if (loginKey != null && loginKey.contains("|")) {
            String[] parts = loginKey.split("\\|", 2);
            if (parts.length == 2 && !parts[0].isBlank() && !parts[1].isBlank()) {
                return tenantRepository.findBySlug(parts[0].trim().toLowerCase(java.util.Locale.ROOT))
                        .flatMap(tenant -> pharmaUserRepository.findByUsernameAndTenantTenantId(
                                parts[1].trim(),
                                tenant.getTenantId()
                        ));
            }
        }

        return pharmaUserRepository.findByUsername(loginKey);
    }

    /**
     * Provides an authentication provider using DaoAuthenticationProvider.
     *
     * @return AuthenticationProvider implementation
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Retrieves an authentication manager based on the authentication configuration.
     *
     * @param config AuthenticationConfiguration instance
     * @return AuthenticationManager instance
     * @throws Exception if there is an issue retrieving the authentication manager
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
