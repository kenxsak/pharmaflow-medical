package com.pharmaflow.tenant;

import java.util.Arrays;

public enum BillingCycle {
    MONTHLY("Monthly"),
    ANNUAL("Annual");

    private final String label;

    BillingCycle(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static BillingCycle fromLabel(String value) {
        return Arrays.stream(values())
                .filter(item -> item.label.equalsIgnoreCase(value) || item.name().equalsIgnoreCase(value))
                .findFirst()
                .orElse(MONTHLY);
    }
}
