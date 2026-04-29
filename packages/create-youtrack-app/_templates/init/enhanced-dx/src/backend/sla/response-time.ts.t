---
to: src/backend/sla/response-time.ts
---
import { Issue } from '@jetbrains/youtrack-scripting-api/entities';
import { requirements } from '../requirements';

export const rule = Issue.sla({
  title: 'Response time SLA',
  guard(ctx) {
    return ctx.issue.resolved == null;
  },
  action(_ctx) {
    // update SLA timers
  },
  requirements,
});
