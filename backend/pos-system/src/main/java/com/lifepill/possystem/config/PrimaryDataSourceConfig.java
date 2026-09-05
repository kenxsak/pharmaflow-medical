package com.lifepill.possystem.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration
@Log4j2
public class PrimaryDataSourceConfig {

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

        // If connecting to external hosted domains that require SSL (Neon, Supabase, AWS RDS, external Render),
        // ensure sslmode=require is set if not already present.
        // For Render internal network hosts (dpg-*), do not force SSL as internal VPC communication is unencrypted.
        boolean isInternalHost = normalizedJdbcUrl.contains("dpg-") && !normalizedJdbcUrl.contains(".render.com");
        if (!isInternalHost && (normalizedJdbcUrl.contains("amazonaws.com") || normalizedJdbcUrl.contains("neon.tech") ||
            normalizedJdbcUrl.contains("supabase.co") || normalizedJdbcUrl.contains("koyeb.app") ||
            (normalizedJdbcUrl.contains(".render.com") && !normalizedJdbcUrl.contains("dpg-")))) {
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
}
