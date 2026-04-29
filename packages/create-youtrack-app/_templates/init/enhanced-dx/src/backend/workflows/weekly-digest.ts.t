---
to: src/backend/workflows/weekly-digest.ts
---
import { Issue } from '@jetbrains/youtrack-scripting-api/entities';
import { requirements } from '../requirements';

export const rule = Issue.onSchedule({
  title: 'Weekly digest',
  cron: '0 0 9 ? * MON',
  search: 'State: {In Progress}',
  action(_ctx) {
    // weekly digest logic
  },
  requirements,
});
