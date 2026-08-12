import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from '@jest/globals';
import {registeredCommandNames} from './index.js';

describe('README command list', () => {
  it('documents exactly the commands registered by the CLI', () => {
    const readme = readReadme();
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

  it('explains project-field schema limits and language support', () => {
    const readme = readReadme();

    expect(readme).toContain('Allowed-value lists may be capped');
    expect(readme).toContain('searches and paginates actual custom-field values');
    expect(readme).toContain('does not provide an internationalization API or translation catalogs');
  });
});

function readReadme(): string {
  return readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');
}
