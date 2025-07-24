---
to: src/backend/router/<%= folderPath %>/<%= method %>.ts
---
<% if (reqType !== 'never') { -%>
/**
 * @zod-to-schema
 */
export type <%= reqType %> = {}

<% } -%>
<% if (resType !== 'never') { -%>
/**
 * @zod-to-schema
 */
export type <%= resType %> = {}

<% } -%>
<% if (controller) { -%>
import { <%= controller %> } from "@backend/controllers/<%= folderPath.replace(/\//g, '.') %>.controller";

export default function handle(ctx: Ctx<%= method.charAt(0) + method.slice(1).toLowerCase() %><<%= reqType %>, <%= resType %>>): void {
  return <%= controller %>(ctx);
}
<% } else { -%>
export default function handle(ctx: Ctx<%= method.charAt(0) + method.slice(1).toLowerCase() %><<%= reqType %>, <%= resType %>>): void {
  // TODO: Implement endpoint logic
  ctx.response.json({ message: "Hello from <%= folderPath %> <%= method %>" });
}
<% } -%>

export type Handle = typeof handle;
