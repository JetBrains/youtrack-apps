to: "<%= (() => { const clean = String(routePath || '').split('/').filter(Boolean).join('/'); const p = 'src/backend/router/' + ytScope + (clean ? '/' + clean : '') + '/' + method + '.ts'; return p; })() %>"
---
<%
  const toPascal = (s) => s.split(/[\/_-]+/).filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  const segments = (routePath || '').split('/').filter(Boolean);
  const base = toPascal([ytScope].concat(segments).join('/')) || 'Root';
  const reqType = base + method + 'Req';
  const resType = base + method + 'Res';
  const ctxType = (method === 'GET' || method === 'HEAD') ? 'CtxGet'
    : method === 'DELETE' ? 'CtxDelete'
    : (method === 'PUT' || method === 'PATCH') ? 'CtxPut'
    : 'CtxPost';
  const perms = (permissions || '').split(',').map(s => s.trim()).filter(Boolean);
%>
<% if (perms.length) { %>import { withPermissions } from '@jetbrains/youtrack-enhanced-dx-tools/runtime';
<% } %>

/**
 * @zod-to-schema
 */
export type <%= reqType %> = {
<% if (method === 'GET' || method === 'DELETE') { %>
  // Query parameters
  // projectId will route calls via project scope when present
  projectId?: string;
  // Add your query params here
  message?: string;
<% } else { %>
  // JSON body payload
  // projectId will route calls via project scope when present
  projectId?: string;
  // Add your body fields here
  message?: string;
<% } %>
};

/**
 * @zod-to-schema
 */
export type <%= resType %> = {
  ok: boolean;
  message: string;
  timestamp: number;
};

function handle(ctx: <%= ctxType %><<%= reqType %>, <%= resType %>>): void {
<% if (method === 'GET' || method === 'DELETE') { %>
  const msg = ctx.request.getParameter('message') || 'Hello from <%= ytScope %>/<%= (routePath || "") %> <%= method %>!';
<% } else { %>
  const body = ctx.request.json() as <%= reqType %>;
  const msg = body.message || 'Hello from <%= ytScope %>/<%= (routePath || "") %> <%= method %>!';
<% } %>
  const response: <%= resType %> = {
    ok: true,
    message: msg,
    timestamp: Date.now()
  };

  ctx.response.json(response);
}

export default <%- perms.length ? `withPermissions(handle, [${perms.map(p => `'${p}'`).join(', ')}])` : 'handle' %>;

export type Handle = typeof handle;
