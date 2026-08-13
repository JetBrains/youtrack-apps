---
to: src/workflows/apply-template.ts
---
import { Issue } from '@jetbrains/youtrack-scripting-api/entities';
import { requirements } from '../backend/requirements';

export const rule = Issue.action({
  title: 'Apply template',
  command: 'apply-template',
  action(_ctx) {
    // template application logic
  },
  requirements,
});
