---
to: src/backend/workflows/issue-state.ts
---
import { Issue } from '@jetbrains/youtrack-scripting-api/entities';
import { requirements } from '../requirements';

export const rule = Issue.stateMachine({
  title: 'Issue state machine',
  fieldName: 'State',
  states: {
    Open: { initial: true, transitions: { start: { targetState: 'In Progress' } } },
    'In Progress': { transitions: { resolve: { targetState: 'Resolved' }, reopen: { targetState: 'Open' } } },
    Resolved: { transitions: {} },
  },
  requirements,
});
