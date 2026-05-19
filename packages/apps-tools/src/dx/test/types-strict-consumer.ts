// Synthetic consumer that imports a representative symbol from every subpath
// of @jetbrains/youtrack-workflow-types. The companion tsconfig
// (`types-strict-tsconfig.json`) runs `tsc --noEmit` with `skipLibCheck: false`
// so that any defect inside the types package surfaces here instead of in
// downstream consumer code.
//
// This file has no runtime behaviour and is not loaded by the test runner.
// Run it with: `npm run typecheck:types`.

import type { Issue, Project, User, State } from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';
import type { AppTypeRegistry, HttpScope } from '@jetbrains/youtrack-workflow-types/apps';
import type { Period } from '@jetbrains/youtrack-workflow-types/date-time';
import type { Connection, Response } from '@jetbrains/youtrack-workflow-types/http';
import type { JSONSchema } from '@jetbrains/youtrack-workflow-types/utility-types';

// Force the symbols to participate in type resolution so unused-import
// inference does not erase them.
type Probe = [Issue, Project, User, State, AppTypeRegistry, HttpScope, Period, Connection, Response, JSONSchema];
declare const _probe: Probe;
void _probe;

// Activate the ambient shim by referencing one of its declared modules.
import type { Issue as IssueViaShim } from '@jetbrains/youtrack-scripting-api/entities';
declare const _shim: IssueViaShim;
void _shim;
