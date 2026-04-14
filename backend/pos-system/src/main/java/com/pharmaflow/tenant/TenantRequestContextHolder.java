package com.pharmaflow.tenant;

public final class TenantRequestContextHolder {

    private static final ThreadLocal<TenantRequestContext> HOLDER = new ThreadLocal<>();

    private TenantRequestContextHolder() {
    }

    public static void set(TenantRequestContext context) {
        HOLDER.set(context);
    }

    public static TenantRequestContext get() {
        return HOLDER.get();
    }

    public static void clear() {
        HOLDER.remove();
    }
}
