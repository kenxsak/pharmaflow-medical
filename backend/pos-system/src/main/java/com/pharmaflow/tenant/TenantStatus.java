package com.pharmaflow.tenant;

import java.util.Arrays;

public enum TenantStatus {
    DRAFT("Draft"),
    PILOT("Pilot"),
    LIVE("Live"),
    EXPANSION("Expansion"),
    ATTENTION("Attention"),
    SUSPENDED("Suspended"),
    CHURNED("Churned");

    private final String label;

    TenantStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static TenantStatus fromLabel(String value) {
        return Arrays.stream(values())
                .filter(item -> item.label.equalsIgnoreCase(value) || item.name().equalsIgnoreCase(value))
                .findFirst()
                .orElse(DRAFT);
    }
}
