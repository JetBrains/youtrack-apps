---
to: src/backend/ai-tools/summarize.ts
---
import type { AITool } from '@jetbrains/youtrack-scripting-api/ai-tools';

export const aiTool: AITool = {
  name: 'summarize_issue',
  description: 'Generates a concise summary for the current issue',
  execute(ctx) {
    return { summary: ctx.issue?.summary ?? '' };
  },
};
