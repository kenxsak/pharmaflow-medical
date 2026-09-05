package com.lifepill.possystem.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
@Log4j2
public class PrimaryDataSourceConfig {

    private static final Pattern JDBC_HOST_PATTERN = Pattern.compile("jdbc:postgresql://([^:/\\?]+)(?::(\\d+))?(/.*)?");

    @Bean(name = "dataSource")
    @Primary
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String jdbcUrl,
            @Value("${spring.datasource.username:${DATABASE_USERNAME:pharmaflow_user}}") String username,
            @Value("${spring.datasource.password:${DATABASE_PASSWORD:PharmaFlow@2024}}") String password,
            @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}") String driverClassName,
            @Value("${spring.datasource.hikari.maximum-pool-size:4}") int maximumPoolSize,
            @Value("${spring.datasource.hikari.minimum-idle:0}") int minimumIdle,
            @Value("${spring.datasource.hikari.connection-timeout:10000}") long connectionTimeout,
            @Value("${spring.datasource.hikari.validation-timeout:5000}") long validationTimeout,
            @Value("${spring.datasource.hikari.idle-timeout:60000}") long idleTimeout,
            @Value("${spring.datasource.hikari.max-lifetime:1800000}") long maxLifetime,
            @Value("${spring.datasource.hikari.keepalive-time:0}") long keepaliveTime,
            @Value("${spring.datasource.hikari.pool-name:pharmaflow-main}") String poolName,
            @Value("${spring.datasource.hikari.data-source-properties.ApplicationName:pharmaflow-backend}") String applicationName,
            @Value("${spring.datasource.hikari.data-source-properties.connectTimeout:10}") int connectTimeoutSeconds,
            @Value("${spring.datasource.hikari.data-source-properties.socketTimeout:30}") int socketTimeoutSeconds,
            @Value("${spring.datasource.hikari.data-source-properties.tcpKeepAlive:true}") boolean tcpKeepAlive
    ) {
        String normalizedJdbcUrl = jdbcUrl != null ? jdbcUrl.trim() : "";
        if (normalizedJdbcUrl.startsWith("postgres://")) {
            normalizedJdbcUrl = "jdbc:postgresql://" + normalizedJdbcUrl.substring("postgres://".length());
        } else if (normalizedJdbcUrl.startsWith("postgresql://")) {
            normalizedJdbcUrl = "jdbc:postgresql://" + normalizedJdbcUrl.substring("postgresql://".length());
        }

        if (normalizedJdbcUrl.startsWith("jdbc:postgresql://") && normalizedJdbcUrl.contains("@")) {
            int atIndex = normalizedJdbcUrl.indexOf('@');
            int schemeEnd = "jdbc:postgresql://".length();
            String userInfo = normalizedJdbcUrl.substring(schemeEnd, atIndex);
            String hostAndRest = normalizedJdbcUrl.substring(atIndex + 1);
            normalizedJdbcUrl = "jdbc:postgresql://" + hostAndRest;
            if ((username == null || username.isEmpty()) && userInfo.contains(":")) {
                username = userInfo.substring(0, userInfo.indexOf(':'));
                if (password == null || password.isEmpty()) {
                    password = userInfo.substring(userInfo.indexOf(':') + 1);
                }
            }
        }

        // Detect and resolve Render internal short hostnames (e.g. dpg-d7u5nt1kh4rs738gqpg0-a)
        Matcher matcher = JDBC_HOST_PATTERN.matcher(normalizedJdbcUrl);
        if (matcher.find()) {
            String rawHost = matcher.group(1);
            String port = matcher.group(2) != null ? ":" + matcher.group(2) : ":5432";
            String pathAndQuery = matcher.group(3) != null ? matcher.group(3) : "";

            if (rawHost != null && rawHost.startsWith("dpg-") && !rawHost.contains(".")) {
                String resolvedHost = resolveRenderDatabaseHost(rawHost);
                if (!resolvedHost.equals(rawHost)) {
                    normalizedJdbcUrl = "jdbc:postgresql://" + resolvedHost + port + pathAndQuery;
                }
            }
        }

        // Only require SSL for external domains (e.g. *.render.com, AWS, Neon, Supabase).
        // Render internal private network hosts (dpg-*) connect directly without SSL.
        if (normalizedJdbcUrl.contains(".render.com") ||
            normalizedJdbcUrl.contains("amazonaws.com") || normalizedJdbcUrl.contains("neon.tech") ||
            normalizedJdbcUrl.contains("supabase.co") || normalizedJdbcUrl.contains("koyeb.app")) {
            if (!normalizedJdbcUrl.contains("sslmode") && !normalizedJdbcUrl.contains("ssl=")) {
                normalizedJdbcUrl += (normalizedJdbcUrl.contains("?") ? "&" : "?") + "sslmode=require";
            }
        }

        log.info("Configuring PrimaryDataSource with URL: {} and User: {}",
                normalizedJdbcUrl.replaceAll(":[^/@]+@", ":****@"), username);

        HikariConfig config = new HikariConfig();
        config.setDriverClassName(driverClassName);
        config.setJdbcUrl(normalizedJdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(maximumPoolSize);
        config.setMinimumIdle(minimumIdle);
        config.setConnectionTimeout(connectionTimeout);
        config.setValidationTimeout(validationTimeout);
        config.setIdleTimeout(idleTimeout);
        config.setMaxLifetime(maxLifetime);
        config.setPoolName(poolName);
        config.setInitializationFailTimeout(-1);

        if (keepaliveTime > 0) {
            config.setKeepaliveTime(keepaliveTime);
        }

        Properties dataSourceProperties = new Properties();
        dataSourceProperties.setProperty("ApplicationName", applicationName);
        dataSourceProperties.setProperty("connectTimeout", String.valueOf(connectTimeoutSeconds));
        dataSourceProperties.setProperty("socketTimeout", String.valueOf(socketTimeoutSeconds));
        dataSourceProperties.setProperty("tcpKeepAlive", String.valueOf(tcpKeepAlive));
        config.setDataSourceProperties(dataSourceProperties);

        return new HikariDataSource(config);
    }

    private String resolveRenderDatabaseHost(String rawHost) {
        // First try direct resolution (internal private network)
        try {
            InetAddress addr = InetAddress.getByName(rawHost);
            log.info("Direct DNS resolution succeeded for internal host: {} ({})", rawHost, addr.getHostAddress());
            return rawHost;
        } catch (UnknownHostException e) {
            log.warn("Direct DNS resolution failed for short host '{}'. Trying regional Render FQDN candidates...", rawHost);
        }

        List<String> regions = new ArrayList<>();
        String envRegion = System.getenv("RENDER_REGION");
        if (envRegion != null && !envRegion.trim().isEmpty()) {
            regions.add(envRegion.trim().toLowerCase());
        }
        for (String r : Arrays.asList("singapore", "oregon", "frankfurt", "ohio", "virginia")) {
            if (!regions.contains(r)) {
                regions.add(r);
            }
        }

        for (String region : regions) {
            String candidate = rawHost + "." + region + "-postgres.render.com";
            try {
                InetAddress addr = InetAddress.getByName(candidate);
                log.info("Successfully resolved Render database FQDN: {} -> {}", candidate, addr.getHostAddress());
                return candidate;
            } catch (UnknownHostException ignored) {
                // Try next region
            }
        }

        String internalCandidate = rawHost + ".render.internal";
        try {
            InetAddress addr = InetAddress.getByName(internalCandidate);
            log.info("Successfully resolved internal FQDN: {} -> {}", internalCandidate, addr.getHostAddress());
            return internalCandidate;
        } catch (UnknownHostException ignored) {
            // Keep original
        }

        log.warn("Could not resolve regional FQDNs for host '{}', proceeding with original", rawHost);
        return rawHost;
    }
}
