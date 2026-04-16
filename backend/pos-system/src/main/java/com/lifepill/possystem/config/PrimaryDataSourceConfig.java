package com.lifepill.possystem.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration
public class PrimaryDataSourceConfig {

    @Bean(name = "dataSource")
    @Primary
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String jdbcUrl,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password,
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
        HikariConfig config = new HikariConfig();
        config.setDriverClassName(driverClassName);
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(maximumPoolSize);
        config.setMinimumIdle(minimumIdle);
        config.setConnectionTimeout(connectionTimeout);
        config.setValidationTimeout(validationTimeout);
        config.setIdleTimeout(idleTimeout);
        config.setMaxLifetime(maxLifetime);
        config.setPoolName(poolName);

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
