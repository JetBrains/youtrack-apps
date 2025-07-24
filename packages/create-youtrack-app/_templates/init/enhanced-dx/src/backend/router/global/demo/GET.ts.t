---
to: "src/backend/router/global/demo/GET.ts"
---

/**
 * @zod-to-schema
 */
export type HealthCheckRes = {
    status: 'ok' | 'error';
    timestamp: string;
    version: string;
};

export default function handle(ctx: CtxGet<never, HealthCheckRes>): void {
    ctx.response.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
}

export type Handle = typeof handle;
