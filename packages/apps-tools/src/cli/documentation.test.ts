import {readFileSync} from 'node:fs';
import {describe, expect, it} from '@jest/globals';
import {registeredCommandNames} from './index.js';

describe('README command list', () => {
  it('documents exactly the commands registered by the CLI', () => {
    const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
    const utilityScripts = readme.match(/^## Utility Scripts\n([\s\S]*?)(?=^### )/m)?.[1];

    expect(utilityScripts).toBeDefined();

    const documentedCommandNames = [
      ...new Set(
        [...utilityScripts!.matchAll(/^- `youtrack-app ([\w-]+) ([\w-]+)/gm)].map(
          ([, entity, action]) => `${entity}:${action}`,
        ),
      ),
    ].sort();

    expect(documentedCommandNames).toEqual([...registeredCommandNames].sort());
  });
});
