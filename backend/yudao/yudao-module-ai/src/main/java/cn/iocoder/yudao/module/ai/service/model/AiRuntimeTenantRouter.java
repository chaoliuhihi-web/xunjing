package cn.iocoder.yudao.module.ai.service.model;

import cn.iocoder.yudao.framework.tenant.core.context.TenantContextHolder;
import cn.iocoder.yudao.framework.tenant.core.util.TenantUtils;

import java.util.Objects;
import java.util.function.Supplier;

/**
 * Runtime AI queries are shared from tenant 1 for all non-tenant1 tenants.
 */
final class AiRuntimeTenantRouter {

    static final Long SHARED_AI_TENANT_ID = 1L;

    private AiRuntimeTenantRouter() {
    }

    static boolean shouldRouteToSharedTenant() {
        Long tenantId = TenantContextHolder.getTenantId();
        return tenantId != null && !Objects.equals(tenantId, SHARED_AI_TENANT_ID);
    }

    static <T> T executeForRuntimeTenant(Supplier<T> supplier) {
        if (!shouldRouteToSharedTenant()) {
            return supplier.get();
        }
        return TenantUtils.execute(SHARED_AI_TENANT_ID, supplier::get);
    }
}
