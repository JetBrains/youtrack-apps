---
to: "src/backend/router/global/echo/POST.ts"
---
/**
 * Example POST handler demonstrating:
 * - Request body handling
 * - Type validation with Zod
 * - Backend logging
 * - Optional metadata
 */

/**
 * @zod-to-schema
 */
export type EchoReq = {
  message: string;
  metadata?: Record<string, unknown>;
};

/**
 * @zod-to-schema
 */
export type EchoRes = {
  echo: string;
  receivedAt: string;
  metadata?: Record<string, unknown>;
};

export default function handle(ctx: CtxPost<EchoReq, EchoRes>): void {
  const body = ctx.request.json();
  
  // Backend logging - logs appear in YouTrack's app logs
  console.log('[Echo] Message received:', body.message);
  
  ctx.response.json({
    echo: body.message,
    receivedAt: new Date().toISOString(),
    metadata: body.metadata
  });
}

export type Handle = typeof handle;
