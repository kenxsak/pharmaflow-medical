package com.pharmaflow.tenant;

import java.util.Arrays;

public enum SupportTier {
    BUSINESS_HOURS("Business Hours"),
    EXTENDED("Extended"),
    ALWAYS_ON("24x7");

    private final String label;

    SupportTier(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static SupportTier fromLabel(String value) {
        return Arrays.stream(values())
                .filter(item -> item.label.equalsIgnoreCase(value) || item.name().equalsIgnoreCase(value))
                .findFirst()
                .orElse(BUSINESS_HOURS);
    }
}
