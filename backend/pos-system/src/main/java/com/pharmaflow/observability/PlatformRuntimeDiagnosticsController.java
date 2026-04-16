package com.pharmaflow.observability;

import com.pharmaflow.observability.dto.DatabaseRuntimeDiagnosticsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/platform/runtime")
@RequiredArgsConstructor
public class PlatformRuntimeDiagnosticsController {

    private final DatabaseRuntimeDiagnosticsService databaseRuntimeDiagnosticsService;

    @GetMapping("/database")
    public DatabaseRuntimeDiagnosticsResponse getDatabaseSnapshot() {
        return databaseRuntimeDiagnosticsService.getSnapshot();
    }
}
