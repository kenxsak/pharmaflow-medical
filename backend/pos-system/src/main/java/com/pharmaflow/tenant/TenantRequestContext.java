package com.pharmaflow.tenant;

import com.pharmaflow.auth.PharmaUser;
import com.pharmaflow.store.Store;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class TenantRequestContext {

    private final PharmaUser user;
    private final Tenant tenant;
    private final TenantSubscription subscription;
    private final Store store;
}
