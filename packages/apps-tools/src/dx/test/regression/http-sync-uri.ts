// Regression fixture — JT-96765 finding 4.
//
// The synchronous Connection methods take an optional `uri`; calling them with
// no URI targets the Connection's base URL. The async-surface sync regressed
// `uri` to a required `string | undefined`, breaking these calls. This fixture
// must compile.

import type { Connection } from '@jetbrains/youtrack-workflow-types/http';

declare const conn: Connection;

conn.getSync();
conn.headSync();
conn.deleteSync();
conn.connectSync();
conn.optionsSync();
conn.postSync();
conn.putSync();
conn.patchSync();
conn.doSync('GET');