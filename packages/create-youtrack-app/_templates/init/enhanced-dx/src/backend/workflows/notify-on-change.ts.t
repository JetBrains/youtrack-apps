---
to: src/workflows/notify-on-change.ts
---
import { Issue } from '@jetbrains/youtrack-scripting-api/entities';
import { requirements } from '../backend/requirements';

export const rule = Issue.onChange({
  title: 'Notify on change',
  action(ctx) {
    console.log('[notify-on-change] changed:', ctx.issue.id);
  },
  requirements,
});
