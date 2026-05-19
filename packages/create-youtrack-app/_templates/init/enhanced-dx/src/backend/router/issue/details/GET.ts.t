---
to: "src/backend/router/issue/details/GET.ts"
---
/**
 * Example issue-scoped GET handler demonstrating:
 * - Issue context access
 * - Extension properties usage
 * - Type-safe issue data
 * - Scope parameter in context type
 */

/**
 * @zod-to-schema
 */
export type IssueDetailsReq = {
  issueId: string;
};

/**
 * @zod-to-schema
 */
export type IssueDetailsRes = {
  id: string;
  summary: string;
  customNote?: string;  // Extension property from entity-extensions.json
  description?: string;
  reporter: string;
};

export default function handle(ctx: CtxGet<IssueDetailsRes, IssueDetailsReq, "issue">): void {
  // Backend logging
  console.log('[Issue Details] Request for:', ctx.issue.id);

  // Access issue context - available because scope is "issue"
  ctx.response.json({
    id: ctx.issue.id,
    summary: ctx.issue.summary,
    customNote: ctx.issue.extensionProperties.customNote,  // Extension property - type-safe!
    description: ctx.issue.description || '',
    reporter: ctx.issue.reporter?.login || 'unknown'
  });
}

export type Handle = typeof handle;
