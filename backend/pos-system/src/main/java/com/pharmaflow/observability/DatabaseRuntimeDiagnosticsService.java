package com.pharmaflow.observability;

import com.pharmaflow.auth.CurrentPharmaUserService;
import com.pharmaflow.observability.dto.DatabaseRuntimeDiagnosticsResponse;
import com.pharmaflow.tenant.TenantAccessService;
import com.zaxxer.hikari.HikariDataSource;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class DatabaseRuntimeDiagnosticsService {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;
    private final MeterRegistry meterRegistry;
    private final CurrentPharmaUserService currentPharmaUserService;
    private final TenantAccessService tenantAccessService;

    @Transactional(readOnly = true)
    public DatabaseRuntimeDiagnosticsResponse getSnapshot() {
        requirePlatformOwner();

        HikariDataSource hikariDataSource = unwrapHikariDataSource();
        String poolName = hikariDataSource != null ? hikariDataSource.getPoolName() : "unknown";
        String applicationName = resolveApplicationName(hikariDataSource);

        Integer activeConnections = toInt(gaugeValue(poolName, "hikaricp.connections.active"));
        Integer idleConnections = toInt(gaugeValue(poolName, "hikaricp.connections.idle"));
        Integer pendingConnections = toInt(gaugeValue(poolName, "hikaricp.connections.pending"));
        Integer maxConnections = toInt(gaugeValue(poolName, "hikaricp.connections.max"));
        Integer minConnections = toInt(gaugeValue(poolName, "hikaricp.connections.min"));

        Long timeoutCount = counterValue(
                poolName,
                "hikaricp.connections.timeout",
                "hikaricp.connections.timeout.total"
        );
        Double acquireMeanMs = timerMeanMs(
                poolName,
                "hikaricp.connections.acquire",
                "hikaricp.connections.acquire.seconds"
        );
        Double usageMeanMs = timerMeanMs(
                poolName,
                "hikaricp.connections.usage",
                "hikaricp.connections.usage.seconds"
        );

        boolean dbReachable = false;
        Long dbPingMs = null;
        String errorSummary = null;
        long pingStartedAt = System.nanoTime();
        try {
            jdbcTemplate.queryForObject("select 1", Integer.class);
            dbReachable = true;
            dbPingMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - pingStartedAt);
        } catch (Exception exception) {
            errorSummary = sanitizeError(exception);
        }

        double utilizationPercent = 0d;
        if (maxConnections != null && maxConnections > 0 && activeConnections != null) {
            utilizationPercent = round((activeConnections * 100d) / maxConnections);
        }

        List<String> advisory = buildAdvisory(
                dbReachable,
                pendingConnections,
                utilizationPercent,
                acquireMeanMs,
                timeoutCount,
                dbPingMs
        );

        return DatabaseRuntimeDiagnosticsResponse.builder()
                .capturedAt(OffsetDateTime.now())
                .status(resolveStatus(dbReachable, pendingConnections, utilizationPercent, acquireMeanMs, timeoutCount))
                .dbReachable(dbReachable)
                .dbPingMs(dbPingMs)
                .poolName(poolName)
                .applicationName(applicationName)
                .activeConnections(defaultInt(activeConnections))
                .idleConnections(defaultInt(idleConnections))
                .pendingConnections(defaultInt(pendingConnections))
                .maxConnections(defaultInt(maxConnections))
                .minConnections(defaultInt(minConnections))
                .utilizationPercent(utilizationPercent)
                .acquireMeanMs(acquireMeanMs)
                .usageMeanMs(usageMeanMs)
                .timeoutCount(timeoutCount)
                .errorSummary(errorSummary)
                .advisory(advisory)
                .build();
    }

    private void requirePlatformOwner() {
        tenantAccessService.requirePlatformOwner(currentPharmaUserService.requireCurrentUser());
    }

    private HikariDataSource unwrapHikariDataSource() {
        if (dataSource instanceof HikariDataSource) {
            return (HikariDataSource) dataSource;
        }
        try {
            return dataSource.unwrap(HikariDataSource.class);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String resolveApplicationName(HikariDataSource hikariDataSource) {
        if (hikariDataSource == null) {
            return "unknown";
        }
        Properties properties = hikariDataSource.getDataSourceProperties();
        return properties.getProperty("ApplicationName", "unknown");
    }

    private double gaugeValue(String poolName, String meterName) {
        Gauge gauge = meterRegistry.find(meterName)
                .tag("pool", poolName)
                .gauge();
        if (gauge == null || Double.isNaN(gauge.value())) {
            return 0d;
        }
        return gauge.value();
    }

    private Long counterValue(String poolName, String... meterNames) {
        for (String meterName : meterNames) {
            Counter counter = meterRegistry.find(meterName)
                    .tag("pool", poolName)
                    .counter();
            if (counter != null) {
                return Math.round(counter.count());
            }
        }
        return 0L;
    }

    private Double timerMeanMs(String poolName, String... meterNames) {
        for (String meterName : meterNames) {
            Timer timer = meterRegistry.find(meterName)
                    .tag("pool", poolName)
                    .timer();
            if (timer != null && timer.count() > 0) {
                return round(timer.mean(TimeUnit.MILLISECONDS));
            }
        }
        return null;
    }

    private List<String> buildAdvisory(
            boolean dbReachable,
            Integer pendingConnections,
            double utilizationPercent,
            Double acquireMeanMs,
            Long timeoutCount,
            Long dbPingMs
    ) {
        List<String> advisory = new ArrayList<>();

        if (!dbReachable) {
            advisory.add("Database ping failed. Check Render Postgres availability and recent restart activity first.");
        }
        if (pendingConnections != null && pendingConnections > 0) {
            advisory.add("Requests are waiting for a database connection. Pool saturation is already visible.");
        }
        if (utilizationPercent >= 90d) {
            advisory.add("Active connections are above 90% of pool capacity. Watch for timeouts or long-running transactions.");
        }
        if (acquireMeanMs != null && acquireMeanMs >= 250d) {
            advisory.add("Mean connection acquisition is elevated. Investigate slow queries or connection starvation.");
        }
        if (timeoutCount != null && timeoutCount > 0) {
            advisory.add("Connection timeout count is non-zero. Review request diagnostics for repeated slow paths.");
        }
        if (dbPingMs != null && dbPingMs >= 500L) {
            advisory.add("Database ping is slow. The DB is reachable, but latency is already elevated.");
        }
        if (advisory.isEmpty()) {
            advisory.add("Database pool looks stable right now. No immediate saturation signals are present.");
        }
        return advisory;
    }

    private String resolveStatus(
            boolean dbReachable,
            Integer pendingConnections,
            double utilizationPercent,
            Double acquireMeanMs,
            Long timeoutCount
    ) {
        if (!dbReachable) {
            return "DOWN";
        }
        if ((pendingConnections != null && pendingConnections > 0)
                || utilizationPercent >= 90d
                || (acquireMeanMs != null && acquireMeanMs >= 250d)
                || (timeoutCount != null && timeoutCount > 0)) {
            return "PRESSURED";
        }
        return "HEALTHY";
    }

    private Integer toInt(double value) {
        return (int) Math.round(value);
    }

    private int defaultInt(Integer value) {
        return value != null ? value : 0;
    }

    private double round(double value) {
        return Math.round(value * 100d) / 100d;
    }

    private String sanitizeError(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return exception.getClass().getSimpleName();
        }
        if (message.length() > 220) {
            return message.substring(0, 220);
        }
        return message;
    }
}
