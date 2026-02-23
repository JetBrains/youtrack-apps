---
to: src/backend/router/<%= folderPath %>/<%= method %>.ts
---
<%
  const ctxName = 'Ctx' + method.charAt(0) + method.slice(1).toLowerCase();
  const isGetOrDelete = method === 'GET' || method === 'DELETE';
  const ctxArgs = isGetOrDelete ? `${resType}, ${reqType}` : `${reqType}, ${resType}`;
-%>
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

export default function handle(ctx: <%= ctxName %><<%= ctxArgs %>>): void {
  return <%= controller %>(ctx);
}
<% } else { -%>
export default function handle(ctx: <%= ctxName %><<%= ctxArgs %>>): void {
  ctx.response.json({ message: "Hello from <%= folderPath %> <%= method %>" });
}
<% } -%>

export type Handle = typeof handle;
